import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications/notify";

/**
 * Cron de lembretes de eventos. Roda a cada hora.
 * Para cada offset (24h, 2h), busca eventos cuja startsAt cai na janela
 * [agora + offset, agora + offset + 1h) e que ainda não tiveram o lembrete
 * disparado (remindersFired->>offset IS NULL).
 *
 * O carimbo em remindersFired é feito via UPDATE atômico com WHERE adicional
 * pra evitar duplicidade caso o cron rode duas vezes na mesma hora.
 */
const OFFSETS = [24, 2] as const;

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let sent = 0;
  let failed = 0;

  for (const offset of OFFSETS) {
    const windowStart = new Date(Date.now() + offset * 60 * 60 * 1000);
    const windowEnd = new Date(windowStart.getTime() + 60 * 60 * 1000);

    // Filtra também por remindersHours pra respeitar a config do evento.
    const offsetKey = String(offset);
    const candidates = await prisma.$queryRaw<
      Array<{
        id: string;
        trainerId: string;
        studentId: string | null;
        title: string;
        startsAt: Date;
      }>
    >`
      SELECT id, "trainerId", "studentId", title, "startsAt"
      FROM "Event"
      WHERE "startsAt" >= ${windowStart}
        AND "startsAt" <  ${windowEnd}
        AND ${offset} = ANY("remindersHours")
        AND ("remindersFired"->>${offsetKey}) IS NULL
    `;

    for (const ev of candidates) {
      // Lock atômico: marca como disparado SÓ se ainda não estiver. Se outra
      // execução do cron correu na mesma janela, count será 0 e a gente pula.
      const claim = await prisma.$executeRaw`
        UPDATE "Event"
        SET "remindersFired" = jsonb_set(
          "remindersFired",
          ARRAY[${offsetKey}]::text[],
          to_jsonb(NOW()::text),
          true
        )
        WHERE id = ${ev.id}
          AND ("remindersFired"->>${offsetKey}) IS NULL
      `;
      if (claim === 0) continue;

      const body = `${ev.title} em ${offset} horas`;

      try {
        await notifyUser({
          userId: ev.trainerId,
          type: "EVENT_REMINDER_PERSONAL",
          title: "Lembrete de evento",
          body,
          data: { eventId: ev.id, studentId: ev.studentId },
          url: `/eventos/${ev.id}`,
        });
        sent++;
      } catch (err) {
        console.error("[cron/events] trainer notify failed", err);
        failed++;
      }

      if (ev.studentId) {
        try {
          await notifyUser({
            userId: ev.studentId,
            type: "EVENT_REMINDER_STUDENT",
            title: "Lembrete de evento",
            body,
            data: { eventId: ev.id },
            url: "/hoje",
          });
          sent++;
        } catch (err) {
          console.error("[cron/events] student notify failed", err);
          failed++;
        }
      }
    }
  }

  return NextResponse.json({ sent, failed });
}
