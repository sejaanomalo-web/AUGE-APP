import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications/notify";

/**
 * Cron horário de lembretes de refeição. Disparado por GitHub Actions
 * (livre do limite Hobby da Vercel) com Authorization: Bearer ${CRON_SECRET}.
 *
 * Lógica: pra cada aluno com MealPlan ativo + NotificationSettings.mealReminder
 * true, procura refeições cujo timeOfDay (HH:MM) começa com a hora atual em
 * BRT (UTC-3). Manda MEAL_REMINDER pra cada uma.
 */
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // BRT = UTC-3 (sem DST desde 2019). Próxima hora cheia em BRT.
  const nowUtc = new Date();
  const brtHour = (nowUtc.getUTCHours() + 24 - 3) % 24;
  const hourPrefix = brtHour.toString().padStart(2, "0");

  // Pega meals do plano ativo cujo timeOfDay começa com a hora atual em BRT.
  const meals = await prisma.meal.findMany({
    where: {
      timeOfDay: { startsWith: hourPrefix + ":" },
      plan: { isActive: true, pausedAt: null },
    },
    include: {
      plan: { select: { studentId: true, name: true } },
    },
  });

  let sent = 0;
  let skipped = 0;

  for (const meal of meals) {
    // Verifica preferência do aluno
    const settings = await prisma.notificationSettings.findUnique({
      where: { userId: meal.plan.studentId },
      select: { mealReminder: true },
    });
    if (settings && settings.mealReminder === false) {
      skipped++;
      continue;
    }

    try {
      await notifyUser({
        userId: meal.plan.studentId,
        type: "MEAL_REMINDER",
        vertical: "NUTRICAO",
        title: `Hora de ${meal.name}`,
        body: `${meal.plan.name} · ${meal.timeOfDay ?? ""}`,
        data: { mealId: meal.id, planId: meal.id },
        url: "/nutricao/hoje",
      });
      sent++;
    } catch (err) {
      console.error("[cron/nutrition-meal-reminder] notify failed", err);
    }
  }

  return NextResponse.json({ brtHour, sent, skipped, total: meals.length });
}
