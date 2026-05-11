"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { subDays, startOfWeek } from "date-fns";

export async function getMyEvolution() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const metrics = await prisma.bodyMetric.findMany({
    where: { studentId: userId },
    orderBy: { date: "asc" },
    take: 100,
  });

  const completedLogs = await prisma.workoutLog.findMany({
    where: {
      studentId: userId,
      status: "COMPLETED",
      startedAt: { gte: subDays(new Date(), 90) },
    },
    include: { exerciseLogs: true },
  });

  const weeklyVolume = new Map<string, number>();
  for (const log of completedLogs) {
    const weekKey = startOfWeek(log.startedAt, { weekStartsOn: 1 })
      .toISOString()
      .slice(0, 10);
    const volume = log.exerciseLogs.reduce(
      (sum, el) =>
        sum + (el.completed && el.weight && el.reps ? el.weight * el.reps : 0),
      0,
    );
    weeklyVolume.set(weekKey, (weeklyVolume.get(weekKey) ?? 0) + volume);
  }

  return {
    metrics,
    weeklyVolume: Array.from(weeklyVolume.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, volume]) => ({ week, volume })),
    totalWorkouts: completedLogs.length,
    avgPerWeek: completedLogs.length / 12,
  };
}
