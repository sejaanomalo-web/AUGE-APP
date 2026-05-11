"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import type { WorkoutMode } from "@prisma/client";

export async function startWorkout(
  sessionId: string,
  mode: WorkoutMode = "GUIDED",
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const existing = await prisma.workoutLog.findFirst({
    where: { sessionId, studentId: userId, status: "IN_PROGRESS" },
  });
  if (existing) {
    // If existing log has different mode, update it (user changed their mind)
    if (existing.mode !== mode) {
      return prisma.workoutLog.update({
        where: { id: existing.id },
        data: { mode },
      });
    }
    return existing;
  }

  return prisma.workoutLog.create({
    data: { sessionId, studentId: userId, status: "IN_PROGRESS", mode },
  });
}

export async function logSet(data: {
  workoutLogId: string;
  exerciseId: string;
  setNumber: number;
  weight?: number;
  reps?: number;
  completed: boolean;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const log = await prisma.workoutLog.findFirst({
    where: { id: data.workoutLogId, studentId: userId },
  });
  if (!log) throw new Error("Log não encontrado");

  const existing = await prisma.exerciseLog.findFirst({
    where: {
      workoutLogId: data.workoutLogId,
      exerciseId: data.exerciseId,
      setNumber: data.setNumber,
    },
  });

  if (existing) {
    return prisma.exerciseLog.update({
      where: { id: existing.id },
      data: { weight: data.weight, reps: data.reps, completed: data.completed },
    });
  }

  return prisma.exerciseLog.create({ data });
}

export async function skipExercise(
  workoutLogId: string,
  exerciseId: string,
  reason?: string,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  await prisma.exerciseLog.create({
    data: {
      workoutLogId,
      exerciseId,
      setNumber: 0,
      skipped: true,
      skippedReason: reason,
    },
  });
}

export async function finishWorkout(
  workoutLogId: string,
  data?: {
    studentNotes?: string;
    /** For FREE mode: list of exerciseIds the student claims to have done */
    completedExerciseIds?: string[];
  },
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const existing = await prisma.workoutLog.findFirst({
    where: { id: workoutLogId, studentId: userId },
    include: { session: { include: { exercises: true } } },
  });
  if (!existing) throw new Error("Log não encontrado");

  // If FREE mode, persist completedExerciseIds as exerciseLogs with setNumber=1
  // (treating them as "done at least once" markers)
  if (existing.mode === "FREE" && data?.completedExerciseIds) {
    for (const exerciseId of data.completedExerciseIds) {
      const already = await prisma.exerciseLog.findFirst({
        where: { workoutLogId, exerciseId, setNumber: 1 },
      });
      if (!already) {
        await prisma.exerciseLog.create({
          data: {
            workoutLogId,
            exerciseId,
            setNumber: 1,
            completed: true,
          },
        });
      }
    }
  }

  const log = await prisma.workoutLog.update({
    where: { id: workoutLogId },
    data: {
      status: "COMPLETED",
      finishedAt: new Date(),
      studentNotes: data?.studentNotes,
    },
  });

  revalidatePath("/hoje");
  revalidatePath("/historico");
  return log;
}

export async function abandonWorkout(workoutLogId: string) {
  await prisma.workoutLog.update({
    where: { id: workoutLogId },
    data: { status: "ABANDONED", finishedAt: new Date() },
  });
  revalidatePath("/hoje");
}

export async function getMyHistory(limit = 30) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  return prisma.workoutLog.findMany({
    where: { studentId: userId, status: { in: ["COMPLETED", "ABANDONED"] } },
    include: {
      session: {
        include: {
          plan: true,
          exercises: { include: { exercise: true } },
        },
      },
      exerciseLogs: { include: { exercise: true } },
    },
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

export async function getWorkoutLogById(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  return prisma.workoutLog.findFirst({
    where: { id, studentId: userId },
    include: {
      session: {
        include: {
          plan: true,
          exercises: {
            orderBy: { order: "asc" },
            include: { exercise: true },
          },
        },
      },
      exerciseLogs: { include: { exercise: true } },
    },
  });
}

export async function getInProgressLog() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  return prisma.workoutLog.findFirst({
    where: { studentId: userId, status: "IN_PROGRESS" },
    include: {
      session: { include: { plan: true } },
    },
  });
}
