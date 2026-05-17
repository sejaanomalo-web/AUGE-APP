"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Returns the calendar + frequency data that powers /evolucao.
 * Scope: pulls every COMPLETED log in the requested year (1 query),
 * derives a set of trained dates + a count per month. Both feed
 * the calendar grid and the frequency line chart.
 *
 * The page is server-rendered per year; the client toggles month
 * inside the cached year payload without hitting the DB again.
 */
export async function getEvolucaoYear(year: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const logs = await prisma.workoutLog.findMany({
    where: {
      studentId: userId,
      status: "COMPLETED",
      startedAt: { gte: start, lt: end },
    },
    select: { startedAt: true },
  });

  // YYYY-MM-DD set — calendar lookup is O(1) per day cell.
  const trainedDates = new Set<string>();
  // 12-slot array indexed by month (0=Jan ... 11=Dez).
  const monthlyCounts: number[] = new Array(12).fill(0);

  for (const l of logs) {
    const d = l.startedAt;
    const key = d.toISOString().slice(0, 10);
    trainedDates.add(key);
    monthlyCounts[d.getMonth()] += 1;
  }

  // Earliest year with data — drives the year dropdown.
  const first = await prisma.workoutLog.findFirst({
    where: { studentId: userId, status: "COMPLETED" },
    orderBy: { startedAt: "asc" },
    select: { startedAt: true },
  });
  const firstYear = first
    ? first.startedAt.getFullYear()
    : new Date().getFullYear();

  return {
    year,
    trainedDates: Array.from(trainedDates),
    monthlyCounts,
    totalThisYear: logs.length,
    firstYearWithData: firstYear,
  };
}
