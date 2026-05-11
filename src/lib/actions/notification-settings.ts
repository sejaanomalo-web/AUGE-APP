"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface NotificationSettingsPatch {
  morningReminder?: boolean;
  eveningReminder?: boolean;
  streakAlerts?: boolean;
  trainerActivity?: boolean;
  studentActivity?: boolean;
  morningReminderHour?: number;
  eveningReminderHour?: number;
}

export async function updateNotificationSettings(
  data: NotificationSettingsPatch,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await prisma.notificationSettings.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  revalidatePath("/perfil/notificacoes");
  revalidatePath("/conta/notificacoes");
}

export async function getOrCreateMySettings() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  let settings = await prisma.notificationSettings.findUnique({
    where: { userId },
  });
  if (!settings) {
    settings = await prisma.notificationSettings.create({ data: { userId } });
  }
  return settings;
}
