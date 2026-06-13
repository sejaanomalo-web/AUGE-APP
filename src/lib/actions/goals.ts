"use server";

import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import type { GoalMetric, GoalPeriod } from "@prisma/client";

export type GoalResult<T = void> =
  | (T extends void ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

/**
 * Prisma errors that mean "the Goal table isn't there yet" - i.e. the
 * migration hasn't run against this database. We want the page to render
 * a friendly state instead of crashing the whole server component.
 *
 *   P2021 - The table `Goal` does not exist
 *   P2022 - The column does not exist (partial migration)
 */
const MISSING_TABLE_CODES = new Set(["P2021", "P2022"]);

function isMissingGoalsTable(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    MISSING_TABLE_CODES.has(err.code)
  );
}

export interface GoalWithProgress {
  id: string;
  sport: string;
  metric: GoalMetric;
  target: number;
  period: GoalPeriod;
  isActive: boolean;
  current: number;
  pct: number; // 0..100
  windowStart: string; // ISO
  windowEnd: string; // ISO
}

function windowFor(period: GoalPeriod, now: Date) {
  if (period === "WEEK") {
    return {
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 }),
    };
  }
  if (period === "MONTH") {
    return { start: startOfMonth(now), end: endOfMonth(now) };
  }
  return { start: startOfYear(now), end: endOfYear(now) };
}

/**
 * Resolve current progress for a goal at read-time. Reads from
 * WorkoutLog (counts) or RunningSession (km) depending on the metric;
 * does NOT cache, so the number is always live.
 */
async function progressFor(
  studentId: string,
  metric: GoalMetric,
  period: GoalPeriod,
): Promise<{ current: number; start: Date; end: Date }> {
  const { start, end } = windowFor(period, new Date());

  if (metric === "WORKOUT_COUNT") {
    const count = await prisma.workoutLog.count({
      where: {
        studentId,
        status: "COMPLETED",
        startedAt: { gte: start, lte: end },
      },
    });
    return { current: count, start, end };
  }

  // DISTANCE_KM - somar no banco (aggregate) em vez de trazer todas as linhas
  // do período só para reduzir em JS. distanceKm é Float não-nulo, então _sum
  // só é null quando não há linhas: o `?? 0` reproduz exatamente o reduce.
  const agg = await prisma.runningSession.aggregate({
    where: { studentId, date: { gte: start, lte: end } },
    _sum: { distanceKm: true },
  });
  return { current: agg._sum.distanceKm ?? 0, start, end };
}

export interface ListGoalsResult {
  goals: GoalWithProgress[];
  /** True when the Goal table doesn't exist yet (migration pending). */
  schemaMissing?: boolean;
}

export async function listMyGoals(): Promise<ListGoalsResult> {
  const { userId } = await auth();
  if (!userId) return { goals: [] };

  let goals: { id: string; sport: string; metric: GoalMetric; target: number; period: GoalPeriod; isActive: boolean }[];
  try {
    goals = await prisma.goal.findMany({
      where: { studentId: userId, isActive: true },
      orderBy: { createdAt: "asc" },
    });
  } catch (err) {
    if (isMissingGoalsTable(err)) {
      console.warn(
        "[listMyGoals] Goal table missing - migration 20260517_add_goals not applied yet.",
      );
      return { goals: [], schemaMissing: true };
    }
    console.error("[listMyGoals] failed", err);
    throw err;
  }

  // progressFor depende só de (metric, period); metas que compartilham os dois
  // produzem o mesmo número, então memoizamos a Promise por chave para evitar
  // round-trips repetidos. Promise.all preserva a ordem original de `goals`
  // (antes: uma query por meta EM SÉRIE).
  const progressCache = new Map<string, ReturnType<typeof progressFor>>();
  const withProgress: GoalWithProgress[] = await Promise.all(
    goals.map(async (g) => {
      const key = `${g.metric}:${g.period}`;
      let progressPromise = progressCache.get(key);
      if (!progressPromise) {
        progressPromise = progressFor(userId, g.metric, g.period);
        progressCache.set(key, progressPromise);
      }
      const p = await progressPromise;
      const pct =
        g.target > 0 ? Math.min(100, (p.current / g.target) * 100) : 0;
      return {
        id: g.id,
        sport: g.sport,
        metric: g.metric,
        target: g.target,
        period: g.period,
        isActive: g.isActive,
        current: p.current,
        pct,
        windowStart: p.start.toISOString(),
        windowEnd: p.end.toISOString(),
      };
    }),
  );
  return { goals: withProgress };
}

export async function createGoal(data: {
  sport: string;
  metric: GoalMetric;
  target: number;
  period: GoalPeriod;
}): Promise<GoalResult<{ id: string }>> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Não autenticado." };

    if (!data.sport?.trim()) {
      return { ok: false, error: "Selecione um esporte." };
    }
    if (!Number.isFinite(data.target) || data.target <= 0) {
      return { ok: false, error: "Meta precisa ser um número maior que zero." };
    }
    if (data.metric === "WORKOUT_COUNT" && data.target > 1000) {
      return { ok: false, error: "Quantidade muito alta. Confira a meta." };
    }
    if (data.metric === "DISTANCE_KM" && data.target > 100000) {
      return { ok: false, error: "Distância muito alta. Confira a meta." };
    }

    // Refuse duplicates: same student × sport × metric × period stays unique.
    const existing = await prisma.goal.findFirst({
      where: {
        studentId: userId,
        sport: data.sport,
        metric: data.metric,
        period: data.period,
        isActive: true,
      },
    });
    if (existing) {
      return {
        ok: false,
        error: "Você já tem uma meta ativa desse tipo. Remova a anterior antes.",
      };
    }

    const goal = await prisma.goal.create({
      data: {
        studentId: userId,
        sport: data.sport.trim(),
        metric: data.metric,
        target: data.target,
        period: data.period,
      },
      select: { id: true },
    });

    revalidatePath("/objetivos");
    return { ok: true, data: { id: goal.id } };
  } catch (err) {
    if (isMissingGoalsTable(err)) {
      return {
        ok: false,
        error:
          "A tabela de objetivos ainda não foi criada no banco. Aplique a migration `20260517_add_goals` antes de continuar.",
      };
    }
    console.error("[createGoal] failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao criar meta.",
    };
  }
}

export async function deleteGoal(id: string): Promise<GoalResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Não autenticado." };

    // deleteMany guards the studentId - caller can only remove their own.
    const res = await prisma.goal.deleteMany({
      where: { id, studentId: userId },
    });
    if (res.count === 0) {
      return { ok: false, error: "Meta não encontrada." };
    }
    revalidatePath("/objetivos");
    return { ok: true };
  } catch (err) {
    console.error("[deleteGoal] failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao remover meta.",
    };
  }
}
