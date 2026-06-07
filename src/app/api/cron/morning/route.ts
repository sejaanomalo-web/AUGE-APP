import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications/notify";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const today = new Date();
  const dayOfWeek = today.getDay();

  // Sessões prescritas pra hoje em planos ativos
  const sessions = await prisma.workoutSession.findMany({
    where: {
      dayOfWeek,
      plan: { isActive: true },
    },
    include: { plan: true },
  });

  const results = await Promise.allSettled(
    sessions.map((session) =>
      notifyUser({
        userId: session.plan.studentId,
        type: "WORKOUT_REMINDER_MORNING",
        title: "Hoje é dia de treino",
        body: `${session.name} - missão de hoje pronta.`,
        data: { sessionId: session.id },
        url: "/hoje",
      }),
    ),
  );

  // === Birthday reminders ===
  // Avisa o personal quando um aluno faz aniversário hoje (fuso SP).
  const birthdayStudents = await prisma.$queryRaw<
    Array<{ id: string; name: string; birthDate: Date }>
  >`
    SELECT id, name, "birthDate"
    FROM "User"
    WHERE "birthDate" IS NOT NULL
      AND role = 'ALUNO'
      AND to_char(("birthDate" AT TIME ZONE 'America/Sao_Paulo'), 'MM-DD') =
          to_char((NOW() AT TIME ZONE 'America/Sao_Paulo'), 'MM-DD')
  `;

  const dedupeSince = new Date(today.getTime() - 20 * 60 * 60 * 1000);
  let birthdayRemindersSent = 0;
  for (const student of birthdayStudents) {
    const ts = await prisma.trainerStudent.findFirst({
      where: { studentId: student.id, status: "ACTIVE" },
    });
    if (!ts) continue;

    // Anti-spam: dedupe 20h.
    const recent = await prisma.notification.findFirst({
      where: {
        userId: ts.trainerId,
        type: "STUDENT_BIRTHDAY",
        createdAt: { gte: dedupeSince },
        data: { path: ["studentId"], equals: student.id },
      },
    });
    if (recent) continue;

    await notifyUser({
      userId: ts.trainerId,
      type: "STUDENT_BIRTHDAY",
      title: "Aniversário de aluno hoje",
      body: `${student.name} faz aniversário hoje`,
      data: { studentId: student.id },
      url: `/alunos/${student.id}`,
    });
    birthdayRemindersSent++;
  }

  return NextResponse.json({
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
    total: sessions.length,
    birthdayRemindersSent,
  });
}
