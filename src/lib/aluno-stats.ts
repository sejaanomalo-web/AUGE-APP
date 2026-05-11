import { startOfWeek, endOfWeek, differenceInDays, subDays } from "date-fns";
import { prisma } from "./prisma";

export async function getAlunoWeeklyStats(studentId: string) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

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

  const durations = logsThisWeek
    .filter((l) => l.finishedAt)
    .map(
      (l) =>
        (l.finishedAt!.getTime() - l.startedAt.getTime()) / 1000 / 60,
    );
  const avgMinutes =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
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
