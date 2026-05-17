import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications/notify";

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
        body: `${session.name} — missão de hoje pronta.`,
        data: { sessionId: session.id },
        url: "/hoje",
      }),
    ),
  );

  return NextResponse.json({
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
    total: sessions.length,
  });
}
