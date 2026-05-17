"use server";

import { auth } from "@clerk/nextjs/server";
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

  // DISTANCE_KM
  const runs = await prisma.runningSession.findMany({
    where: { studentId, date: { gte: start, lte: end } },
    select: { distanceKm: true },
  });
  const total = runs.reduce((a, r) => a + (r.distanceKm ?? 0), 0);
  return { current: total, start, end };
}

export async function listMyGoals(): Promise<GoalWithProgress[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const goals = await prisma.goal.findMany({
    where: { studentId: userId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  const withProgress: GoalWithProgress[] = [];
  for (const g of goals) {
    const p = await progressFor(userId, g.metric, g.period);
    const pct = g.target > 0 ? Math.min(100, (p.current / g.target) * 100) : 0;
    withProgress.push({
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
    });
  }
  return withProgress;
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
      return { ok: false, error: "Quantidade muito alta — confira a meta." };
    }
    if (data.metric === "DISTANCE_KM" && data.target > 100000) {
      return { ok: false, error: "Distância muito alta — confira a meta." };
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

    // deleteMany guards the studentId — caller can only remove their own.
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
