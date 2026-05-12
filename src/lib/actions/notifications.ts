"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMyNotifications(limit = 30) {
  const { userId } = await auth();
  if (!userId) return [];
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount() {
  const { userId } = await auth();
  if (!userId) return 0;
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function markAsRead(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true, readAt: new Date() },
  });
  revalidatePath("/");
}

export async function markAllAsRead() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true, readAt: new Date() },
  });
  revalidatePath("/");
}

export async function deleteNotification(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await prisma.notification.deleteMany({ where: { id, userId } });
  revalidatePath("/");
}

export async function deleteAllNotifications() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await prisma.notification.deleteMany({ where: { userId } });
  revalidatePath("/");
}
