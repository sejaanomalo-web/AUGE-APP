import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications/notify";
import { startOfDay, endOfDay, subDays } from "date-fns";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const dayOfWeek = now.getDay();

  // 1. Alunos com treino hoje que ainda não treinaram
  const sessionsToday = await prisma.workoutSession.findMany({
    where: { dayOfWeek, plan: { isActive: true } },
    include: { plan: true },
  });

  let eveningSent = 0;
  for (const session of sessionsToday) {
    const completed = await prisma.workoutLog.findFirst({
      where: {
        sessionId: session.id,
        studentId: session.plan.studentId,
        status: "COMPLETED",
        startedAt: { gte: startOfDay(now), lte: endOfDay(now) },
      },
    });
    if (!completed) {
      await notifyUser({
        userId: session.plan.studentId,
        type: "WORKOUT_REMINDER_EVENING",
        title: "Ainda dá tempo ⏰",
        body: `Você não treinou hoje. ${session.name} te espera`,
        data: { sessionId: session.id },
        url: "/hoje",
      });
      eveningSent++;
    }
  }

  // 2. Streak quebrado (3 dias sem treinar) — alunos vinculados a personal
  const threeDaysAgo = subDays(now, 3);
  const inactiveStudents = await prisma.user.findMany({
    where: {
      role: "ALUNO",
      workoutLogs: {
        none: {
          status: "COMPLETED",
          startedAt: { gte: threeDaysAgo },
        },
      },
      studentLinks: { some: { status: "ACTIVE" } },
    },
  });

  let streakSent = 0;
  for (const student of inactiveStudents) {
    // Evita spam: só 1x por semana
    const recent = await prisma.notification.findFirst({
      where: {
        userId: student.id,
        type: "STREAK_BROKEN",
        createdAt: { gte: subDays(now, 7) },
      },
    });
    if (recent) continue;

    await notifyUser({
      userId: student.id,
      type: "STREAK_BROKEN",
      title: "Sentimos sua falta 💭",
      body: "Você está há 3 dias sem treinar. Bora voltar?",
      data: {},
      url: "/hoje",
    });
    streakSent++;
  }

  return NextResponse.json({ eveningSent, streakSent });
}
