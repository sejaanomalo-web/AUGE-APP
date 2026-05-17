import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import type { NotificationType, Prisma } from "@prisma/client";

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  const subject = process.env.VAPID_SUBJECT;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !pub || !priv) {
    // intentionally don't throw - keeps DB-side notify working even if push is misconfigured
    return;
  }
  webpush.setVapidDetails(subject, pub, priv);
  vapidConfigured = true;
}

export interface NotifyParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  url?: string;
}

export async function notifyUser(params: NotifyParams) {
  // 1. INSERT no DB - fonte da verdade. Sempre acontece.
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: (params.data ?? null) as Prisma.InputJsonValue,
    },
  });

  // 2. Verifica preferência do usuário
  const settings = await prisma.notificationSettings.findUnique({
    where: { userId: params.userId },
  });
  if (!checkPreference(params.type, settings)) return notification;

  // 3. Best-effort push. Não bloqueia retorno; UI/Realtime aparece igual.
  sendPushToUser(params.userId, {
    title: params.title,
    body: params.body,
    data: params.data,
    url: params.url ?? "/",
    tag: `auge-${params.type}`,
  })
    .then(() =>
      prisma.notification.update({
        where: { id: notification.id },
        data: { pushSent: true },
      }),
    )
    .catch((err: unknown) =>
      prisma.notification
        .update({
          where: { id: notification.id },
          data: {
            pushSent: false,
            pushError:
              err instanceof Error ? err.message.slice(0, 200) : String(err),
          },
        })
        .catch(() => null),
    );

  return notification;
}

async function sendPushToUser(
  userId: string,
  payload: {
    title: string;
    body: string;
    data?: unknown;
    url?: string;
    tag?: string;
  },
) {
  ensureVapid();
  if (!vapidConfigured) throw new Error("VAPID not configured");

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });
  if (subscriptions.length === 0) throw new Error("No subscriptions");

  const payloadStr = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payloadStr,
        );
        await prisma.pushSubscription.update({
          where: { id: sub.id },
          data: { lastUsedAt: new Date() },
        });
      } catch (err) {
        const status = (err as { statusCode?: number })?.statusCode;
        // 410 Gone / 404 Not Found = subscription morta. Limpar.
        if (status === 410 || status === 404) {
          await prisma.pushSubscription
            .delete({ where: { id: sub.id } })
            .catch(() => null);
        }
        throw err;
      }
    }),
  );
}

type SettingsKey =
  | "morningReminder"
  | "eveningReminder"
  | "streakAlerts"
  | "trainerActivity"
  | "studentActivity";

const TYPE_TO_PREF: Partial<Record<NotificationType, SettingsKey>> = {
  WORKOUT_REMINDER_MORNING: "morningReminder",
  WORKOUT_REMINDER_EVENING: "eveningReminder",
  STREAK_BROKEN: "streakAlerts",
  WORKOUT_PLAN_CREATED: "trainerActivity",
  WORKOUT_PLAN_UPDATED: "trainerActivity",
  WORKOUT_EXERCISE_UPDATED: "trainerActivity",
  WORKOUT_SCHEDULE_UPDATED: "trainerActivity",
  EXAM_RECEIVED: "trainerActivity",
  TRAINER_COMMENT: "trainerActivity",
  STUDENT_WORKOUT_STARTED: "studentActivity",
  STUDENT_WORKOUT_FINISHED: "studentActivity",
  STUDENT_WORKOUT_SKIPPED: "studentActivity",
  STUDENT_METRIC_ADDED: "studentActivity",
  STUDENT_EXAM_UPLOADED: "studentActivity",
  STUDENT_INVITE_ACCEPTED: "studentActivity",
};

function checkPreference(
  type: NotificationType,
  settings: { [k in SettingsKey]?: boolean } | null,
): boolean {
  if (!settings) return true;
  const key = TYPE_TO_PREF[type];
  if (!key) return true;
  return settings[key] !== false;
}
