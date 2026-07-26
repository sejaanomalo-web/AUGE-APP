"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  requireUserId,
  assertPlanAccess,
  assertSessionAccess,
  assertSessionExerciseAccess,
} from "@/lib/actions/authz";

export async function createSession(
  planId: string,
  data: {
    name: string;
    dayOfWeek?: number;
    order?: number;
    notes?: string;
  },
) {
  const userId = await requireUserId();
  await assertPlanAccess(userId, planId, "write");

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
  const userId = await requireUserId();
  await assertSessionAccess(userId, id, "write");
  await prisma.workoutSession.update({ where: { id }, data });
}

export async function deleteSession(id: string) {
  const userId = await requireUserId();
  await assertSessionAccess(userId, id, "write");
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
  const userId = await requireUserId();
  await assertSessionAccess(userId, sessionId, "write");
  return prisma.sessionExercise.create({
    data: { sessionId, exerciseId, ...config },
  });
}

export async function removeExerciseFromSession(sessionExerciseId: string) {
  const userId = await requireUserId();
  await assertSessionExerciseAccess(userId, sessionExerciseId, "write");
  await prisma.sessionExercise.delete({ where: { id: sessionExerciseId } });
}

export async function reorderExercises(
  sessionId: string,
  orderedIds: string[],
) {
  const userId = await requireUserId();
  await assertSessionAccess(userId, sessionId, "write");
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
  const userId = await requireUserId();
  await assertSessionAccess(userId, id, "read");
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
