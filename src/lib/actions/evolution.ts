"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  endOfMonth,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";

export async function getMyEvolution() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  // Pull a year of completed logs — feeds the monthly bar chart + lifetime
  // aggregates while still keeping the query scoped.
  const yearAgo = subMonths(now, 12);

  const metrics = await prisma.bodyMetric.findMany({
    where: { studentId: userId },
    orderBy: { date: "asc" },
    take: 100,
  });

  const completedLogs = await prisma.workoutLog.findMany({
    where: {
      studentId: userId,
      status: "COMPLETED",
      startedAt: { gte: yearAgo },
    },
    include: { exerciseLogs: { include: { exercise: true } } },
  });

  // Lifetime totals (90-day window for the "trimestral" summary lives below).
  const last90Cutoff = subDays(now, 90);
  const last90Logs = completedLogs.filter(
    (l) => l.startedAt >= last90Cutoff,
  );

  // Weekly volume — last 12 weeks (drives the volume bar chart).
  const weeklyVolume = new Map<string, number>();
  for (const log of last90Logs) {
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

  // Monthly workout counts — last 12 calendar months.
  const monthlyCounts = new Map<string, number>();
  for (const log of completedLogs) {
    const key = log.startedAt.toISOString().slice(0, 7); // "YYYY-MM"
    monthlyCounts.set(key, (monthlyCounts.get(key) ?? 0) + 1);
  }

  // Lifetime aggregates (still scoped to the year window for cost reasons).
  let totalVolume = 0;
  let totalDurationSec = 0;
  let totalFinished = 0;
  // Per-exercise best (heaviest completed set) → "PRs" leaderboard.
  const prByExercise = new Map<
    string,
    { name: string; weight: number; reps: number; date: Date }
  >();

  for (const log of completedLogs) {
    if (log.finishedAt) {
      totalDurationSec +=
        (log.finishedAt.getTime() - log.startedAt.getTime()) / 1000;
      totalFinished++;
    }
    for (const el of log.exerciseLogs) {
      if (el.completed && el.weight && el.reps) {
        totalVolume += el.weight * el.reps;
        const existing = prByExercise.get(el.exerciseId);
        if (!existing || el.weight > existing.weight) {
          prByExercise.set(el.exerciseId, {
            name: el.exercise.name,
            weight: el.weight,
            reps: el.reps,
            date: log.startedAt,
          });
        }
      }
    }
  }

  const topPRs = Array.from(prByExercise.values())
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map((pr) => ({
      name: pr.name,
      weight: pr.weight,
      reps: pr.reps,
      dateIso: pr.date.toISOString(),
    }));

  const monthCount = completedLogs.filter(
    (l) => l.startedAt >= monthStart && l.startedAt <= monthEnd,
  ).length;

  // Per-day summary still emitted (lightweight) for legacy consumers.
  const dailyWorkouts = completedLogs.map((log) => {
    const volume = log.exerciseLogs.reduce(
      (sum, el) =>
        sum + (el.completed && el.weight && el.reps ? el.weight * el.reps : 0),
      0,
    );
    return { date: log.startedAt, volume };
  });

  const avgMinutesAll =
    totalFinished > 0 ? Math.round(totalDurationSec / 60 / totalFinished) : 0;

  return {
    metrics,
    weeklyVolume: Array.from(weeklyVolume.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, volume]) => ({ week, volume })),
    monthlyCounts: Array.from(monthlyCounts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count })),
    dailyWorkouts,
    totalWorkouts: completedLogs.length,
    last90Workouts: last90Logs.length,
    monthCount,
    totalVolume: Math.round(totalVolume),
    avgMinutesAll,
    avgPerWeek: last90Logs.length / 12,
    topPRs,
  };
}
