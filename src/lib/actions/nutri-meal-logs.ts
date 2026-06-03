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
