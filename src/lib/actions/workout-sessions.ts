"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function assertPlanOwner(userId: string, planId: string) {
  const plan = await prisma.workoutPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error("Plano não encontrado");
  const ok =
    plan.trainerId === userId ||
    (plan.trainerId === null && plan.studentId === userId);
  if (!ok) throw new Error("Sem permissão");
  return plan;
}

export async function createSession(
  planId: string,
  data: {
    name: string;
    dayOfWeek?: number;
    order?: number;
    notes?: string;
  },
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  await assertPlanOwner(userId, planId);

  const session = await prisma.workoutSession.create({
    data: { ...data, planId },
  });

  revalidatePath(`/treinos/${planId}`);
  revalidatePath(`/planos/${planId}`);
  return session;
}

export async function updateSession(
  id: string,
  data: Partial<{ name: string; dayOfWeek: number; order: number; notes: string }>,
) {
  await prisma.workoutSession.update({ where: { id }, data });
}

export async function deleteSession(id: string) {
  await prisma.workoutSession.delete({ where: { id } });
}

export async function addExerciseToSession(
  sessionId: string,
  exerciseId: string,
  config: {
    sets: number;
    reps: string;
    restSeconds?: number;
    weight?: number;
    notes?: string;
    order?: number;
  },
) {
  return prisma.sessionExercise.create({
    data: { sessionId, exerciseId, ...config },
  });
}

export async function removeExerciseFromSession(sessionExerciseId: string) {
  await prisma.sessionExercise.delete({ where: { id: sessionExerciseId } });
}

export async function reorderExercises(
  sessionId: string,
  orderedIds: string[],
) {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.sessionExercise.update({
        where: { id },
        data: { order: index },
      }),
    ),
  );
  revalidatePath(`/treinos`);
}

export async function getSessionById(id: string) {
  return prisma.workoutSession.findUnique({
    where: { id },
    include: {
      plan: true,
      exercises: {
        orderBy: { order: "asc" },
        include: { exercise: true },
      },
    },
  });
}
