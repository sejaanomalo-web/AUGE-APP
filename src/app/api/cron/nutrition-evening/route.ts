import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications/notify";

const INACTIVITY_DAYS = 3;

/**
 * Cron diário noturno (BRT) - disparado por GitHub Actions às 22 UTC.
 * Para cada NutritionistStudent ACTIVE, verifica se o aluno tem MealPlan
 * ativo e se a última MealLog é > 3 dias atrás. Se sim, notifica a
 * nutricionista com STUDENT_INACTIVE (vertical=NUTRICAO).
 */
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const threshold = new Date(
    Date.now() - INACTIVITY_DAYS * 24 * 60 * 60 * 1000,
  );

  const links = await prisma.nutritionistStudent.findMany({
    where: { status: "ACTIVE" },
    select: {
      nutritionistId: true,
      studentId: true,
      student: { select: { name: true } },
    },
  });

  let sent = 0;
  let activeOk = 0;

  for (const link of links) {
    // Verifica se aluno tem cardápio ativo
    const activePlan = await prisma.mealPlan.findFirst({
      where: {
        studentId: link.studentId,
        isActive: true,
        pausedAt: null,
      },
      select: { id: true },
    });
    if (!activePlan) continue;

    // Última MealLog deste aluno
    const lastLog = await prisma.mealLog.findFirst({
      where: { studentId: link.studentId },
      orderBy: { date: "desc" },
      select: { date: true },
    });

    if (lastLog && lastLog.date >= threshold) {
      activeOk++;
      continue;
    }

    try {
      await notifyUser({
        userId: link.nutritionistId,
        type: "STUDENT_INACTIVE",
        vertical: "NUTRICAO",
        title: "Aluno sem atividade",
        body: `${link.student.name} não registra refeições há mais de ${INACTIVITY_DAYS} dias.`,
        data: { studentId: link.studentId },
        url: `/nutri/alunos/${link.studentId}`,
      });
      sent++;
    } catch (err) {
      console.error("[cron/nutrition-evening] notify failed", err);
    }
  }

  return NextResponse.json({ sent, activeOk, total: links.length });
}
