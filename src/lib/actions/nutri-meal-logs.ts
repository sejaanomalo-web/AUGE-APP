"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications/notify";
import type { MealLogStatus } from "@prisma/client";

/**
 * Returns the aluno's active MealPlans (isActive=true && not paused),
 * including meals + items + foods. Used by /nutricao/hoje and
 * /nutricao/cardapio.
 */
export async function getMyActiveMealPlans() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  return prisma.mealPlan.findMany({
    where: { studentId: userId, isActive: true, pausedAt: null },
    orderBy: { startDate: "desc" },
    include: {
      nutritionist: { select: { id: true, name: true, avatarUrl: true } },
      meals: {
        orderBy: { order: "asc" },
        include: {
          items: {
            orderBy: { order: "asc" },
            include: { food: true },
          },
        },
      },
    },
  });
}

export async function getMyMealPlanHistory() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  return prisma.mealPlan.findMany({
    where: { studentId: userId },
    orderBy: [{ isActive: "desc" }, { startDate: "desc" }],
    include: {
      nutritionist: { select: { id: true, name: true, avatarUrl: true } },
      meals: { select: { id: true } },
    },
  });
}

/**
 * Returns today's MealLogs for the current aluno keyed by mealId. Used to
 * show LOGGED / SKIPPED state on /nutricao/hoje cards.
 */
export async function getTodayMealLogs() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  // Range = today [00:00, 23:59:59.999] in UTC (DATE column ignores time).
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);

  const logs = await prisma.mealLog.findMany({
    where: {
      studentId: userId,
      date: { gte: start, lte: end },
    },
  });

  return Object.fromEntries(logs.map((l) => [l.mealId, l]));
}

export async function logMeal(
  mealId: string,
  status: MealLogStatus,
  notes?: string,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  // Verify the meal belongs to a plan owned by the current user
  const meal = await prisma.meal.findUnique({
    where: { id: mealId },
    include: { plan: true },
  });
  if (!meal) throw new Error("Refeição não encontrada");
  if (meal.plan.studentId !== userId)
    throw new Error("Sem permissão pra logar esta refeição");

  const today = new Date();
  const dateOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  // Upsert: se já tinha log de hoje pra esta refeição, atualiza.
  const existing = await prisma.mealLog.findFirst({
    where: { mealId, studentId: userId, date: dateOnly },
  });

  if (existing) {
    await prisma.mealLog.update({
      where: { id: existing.id },
      data: {
        status,
        studentNotes: notes ?? existing.studentNotes,
        finishedAt: status === "LOGGED" ? new Date() : existing.finishedAt,
      },
    });
  } else {
    await prisma.mealLog.create({
      data: {
        mealId,
        studentId: userId,
        date: dateOnly,
        status,
        mode: "GUIDED",
        studentNotes: notes ?? null,
        finishedAt: status === "LOGGED" ? new Date() : null,
      },
    });
  }

  // Notifica nutricionista
  if (meal.plan.nutritionistId) {
    notifyUser({
      userId: meal.plan.nutritionistId,
      type: status === "LOGGED" ? "STUDENT_MEAL_LOGGED" : "STUDENT_MEAL_SKIPPED",
      vertical: "NUTRICAO",
      title: status === "LOGGED" ? "Refeição registrada" : "Refeição pulada",
      body: `${meal.name} (${meal.plan.name})`,
      data: { studentId: userId, mealId, planId: meal.plan.id },
      url: `/nutri/alunos/${userId}`,
    }).catch(() => null);
  }

  revalidatePath("/nutricao/hoje");
}

export interface HydrationToday {
  totalMl: number;
  entries: number;
}

export async function getTodayHydration(): Promise<HydrationToday> {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const today = new Date();
  const dateOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const agg = await prisma.hydrationLog.aggregate({
    where: { studentId: userId, date: dateOnly },
    _sum: { ml: true },
    _count: true,
  });

  return {
    totalMl: agg._sum.ml ?? 0,
    entries: agg._count,
  };
}

export interface NutritionEvolutionDay {
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** Aderência do dia em % (0-100), ou null se não havia refeições previstas. */
  adherence: number | null;
  /** Calorias previstas das refeições registradas (LOGGED) no dia. */
  calories: number;
  /** Total de hidratação no dia, em ml. */
  hydration: number;
}

export interface NutritionEvolution {
  rangeDays: number;
  days: NutritionEvolutionDay[];
  /** Nº de refeições previstas/dia (soma das refeições dos planos ativos). */
  scheduledPerDay: number;
  /** Meta de calorias do plano ativo, se houver. */
  targetCalories: number | null;
  /** true se há ao menos um registro de refeição/hidratação no período. */
  hasData: boolean;
}

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * Série diária dos últimos `rangeDays` dias para a tela /nutricao/evolucao:
 * aderência (refeições registradas / previstas), calorias previstas registradas
 * e hidratação. Somente leitura.
 */
export async function getNutritionEvolution(
  rangeDays = 30,
): Promise<NutritionEvolution> {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const span = Math.max(1, Math.min(rangeDays, 365));

  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end.getTime() - (span - 1) * 24 * 60 * 60 * 1000);
  const endInclusive = new Date(end.getTime() + 24 * 60 * 60 * 1000 - 1);

  const [activePlans, mealLogs, hydrationGroups] = await Promise.all([
    prisma.mealPlan.findMany({
      where: { studentId: userId, isActive: true, pausedAt: null },
      select: {
        targetCalories: true,
        meals: { select: { id: true } },
      },
    }),
    prisma.mealLog.findMany({
      where: {
        studentId: userId,
        date: { gte: start, lte: endInclusive },
        status: "LOGGED",
      },
      include: {
        meal: { include: { items: { include: { food: true } } } },
      },
    }),
    prisma.hydrationLog.groupBy({
      by: ["date"],
      where: { studentId: userId, date: { gte: start, lte: endInclusive } },
      _sum: { ml: true },
    }),
  ]);

  const scheduledPerDay = activePlans.reduce(
    (acc, p) => acc + p.meals.length,
    0,
  );
  const targetCalories =
    activePlans.find((p) => p.targetCalories != null)?.targetCalories ?? null;

  // Agrega por dia.
  const loggedByDay = new Map<string, number>();
  const caloriesByDay = new Map<string, number>();
  for (const log of mealLogs) {
    const key = isoDay(new Date(log.date));
    loggedByDay.set(key, (loggedByDay.get(key) ?? 0) + 1);
    const kcal = log.meal.items.reduce(
      (acc, it) => acc + (Number(it.quantity) / 100) * it.food.kcalPer100g,
      0,
    );
    caloriesByDay.set(key, (caloriesByDay.get(key) ?? 0) + kcal);
  }

  const hydrationByDay = new Map<string, number>();
  for (const g of hydrationGroups) {
    hydrationByDay.set(isoDay(new Date(g.date)), g._sum.ml ?? 0);
  }

  const days: NutritionEvolutionDay[] = [];
  for (let i = 0; i < span; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const key = isoDay(d);
    const logged = loggedByDay.get(key) ?? 0;
    days.push({
      date: key,
      adherence:
        scheduledPerDay > 0
          ? Math.min(100, Math.round((logged / scheduledPerDay) * 100))
          : null,
      calories: Math.round(caloriesByDay.get(key) ?? 0),
      hydration: hydrationByDay.get(key) ?? 0,
    });
  }

  const hasData = mealLogs.length > 0 || hydrationGroups.length > 0;

  return { rangeDays: span, days, scheduledPerDay, targetCalories, hasData };
}

/**
 * Datas (YYYY-MM-DD) do ano com ao menos uma refeição registrada (LOGGED),
 * para o calendário de aderência da tela /nutricao/evolucao. Somente leitura.
 */
export async function getNutritionLoggedDates(year: number): Promise<string[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);

  const logs = await prisma.mealLog.findMany({
    where: {
      studentId: userId,
      status: "LOGGED",
      date: { gte: start, lte: end },
    },
    select: { date: true },
    distinct: ["date"],
  });

  return logs.map((l) => isoDay(new Date(l.date)));
}

export async function logHydration(ml: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  if (!Number.isFinite(ml) || ml <= 0)
    throw new Error("Quantidade inválida.");

  const today = new Date();
  const dateOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  await prisma.hydrationLog.create({
    data: {
      studentId: userId,
      date: dateOnly,
      ml: Math.round(ml),
      source: "manual",
    },
  });

  revalidatePath("/nutricao/hoje");
}
