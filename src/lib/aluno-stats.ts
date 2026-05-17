import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInDays,
  subDays,
} from "date-fns";
import { prisma } from "./prisma";

export async function getAlunoWeeklyStats(studentId: string) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const logsThisWeek = await prisma.workoutLog.findMany({
    where: {
      studentId,
      status: "COMPLETED",
      startedAt: { gte: weekStart, lte: weekEnd },
    },
    include: { exerciseLogs: true },
  });

  const completedWorkouts = logsThisWeek.length;
  const volume = logsThisWeek.reduce(
    (sum, log) =>
      sum +
      log.exerciseLogs.reduce(
        (s, el) =>
          s + (el.completed && el.weight && el.reps ? el.weight * el.reps : 0),
        0,
      ),
    0,
  );

  // Treinos no mês — count of completed workouts in the current calendar month.
  const monthCount = await prisma.workoutLog.count({
    where: {
      studentId,
      status: "COMPLETED",
      startedAt: { gte: monthStart, lte: monthEnd },
    },
  });

  // Tempo médio dos treinos — total duration / total count across ALL
  // completed workouts (lifetime average). Reads as "how long a typical
  // session lasts for me" rather than a weekly snapshot.
  const allCompleted = await prisma.workoutLog.findMany({
    where: { studentId, status: "COMPLETED", finishedAt: { not: null } },
    select: { startedAt: true, finishedAt: true },
  });
  const totalSecondsAll = allCompleted.reduce(
    (a, l) => a + (l.finishedAt!.getTime() - l.startedAt.getTime()) / 1000,
    0,
  );
  const avgMinutes =
    allCompleted.length > 0
      ? Math.round(totalSecondsAll / 60 / allCompleted.length)
      : 0;

  // Streak — consecutive days with at least 1 completed workout in last 90d
  const last90 = await prisma.workoutLog.findMany({
    where: {
      studentId,
      status: "COMPLETED",
      startedAt: { gte: subDays(now, 90) },
    },
    select: { startedAt: true },
    orderBy: { startedAt: "desc" },
  });
  const trainedDays = new Set(
    last90.map((l) => l.startedAt.toISOString().slice(0, 10)),
  );
  let streak = 0;
  let cursor = new Date(now);
  for (let i = 0; i < 90; i++) {
    const key = cursor.toISOString().slice(0, 10);
    if (trainedDays.has(key)) {
      streak++;
    } else if (i === 0) {
      // OK if today not yet trained
    } else {
      break;
    }
    cursor = subDays(cursor, 1);
  }

  return {
    completedWorkouts,
    monthCount,
    volume: Math.round(volume),
    avgMinutes,
    streakDays: streak,
  };
}

export function dayOfWeekMatch(
  sessions: { dayOfWeek: number | null }[],
  date: Date,
): number | null {
  const dow = date.getDay(); // 0=Sun, 1=Mon...
  const found = sessions.findIndex((s) => s.dayOfWeek === dow);
  return found >= 0 ? found : null;
}

export function daysUntilSession(dayOfWeek: number, from: Date): number {
  const today = from.getDay();
  let delta = dayOfWeek - today;
  if (delta < 0) delta += 7;
  return delta;
}

/**
 * Project the plan's weekly schedule across a date range. Returns one entry
 * per session per matching weekday in the window. Used by /planos to render
 * the user's workouts under arbitrary period filters (today / week / month /
 * year). For the simple "next 5 upcoming", keep using nextUpcomingSessions.
 */
export function projectSessionsInRange<
  T extends { dayOfWeek: number | null },
>(sessions: T[], from: Date, days: number): { date: Date; session: T }[] {
  const result: { date: Date; session: T }[] = [];
  const sessionsWithDay = sessions.filter(
    (s): s is T & { dayOfWeek: number } => s.dayOfWeek != null,
  );
  if (sessionsWithDay.length === 0) return result;
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i <= days; i++) {
    const dow = cursor.getDay();
    for (const match of sessionsWithDay.filter((s) => s.dayOfWeek === dow)) {
      result.push({ date: new Date(cursor), session: match });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export function nextUpcomingSessions<
  T extends { dayOfWeek: number | null },
>(sessions: T[], from: Date, count = 5): { date: Date; session: T }[] {
  const result: { date: Date; session: T }[] = [];
  const sessionsWithDay = sessions.filter(
    (s): s is T & { dayOfWeek: number } => s.dayOfWeek != null,
  );
  if (sessionsWithDay.length === 0) return result;

  let cursor = new Date(from);
  cursor.setDate(cursor.getDate() + 1); // tomorrow onwards
  for (let day = 0; day < 21 && result.length < count; day++) {
    const dow = cursor.getDay();
    const match = sessionsWithDay.find((s) => s.dayOfWeek === dow);
    if (match) {
      result.push({ date: new Date(cursor), session: match });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export function differenceFromToday(iso: string): number {
  return differenceInDays(new Date(), new Date(iso));
}
