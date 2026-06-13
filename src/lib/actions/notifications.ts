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

/**
 * Lista + contagem de não-lidas numa ÚNICA server action (uma chamada auth()
 * e uma transação Prisma), em vez de duas actions separadas. Usado pelo sino,
 * que carrega em todo shell autenticado — corta uma ida ao Clerk + um
 * round-trip por montagem do header. Contagem exata (não derivada do limit).
 */
export async function getNotificationsWithCount(limit = 30) {
  const { userId } = await auth();
  if (!userId) return { items: [], unreadCount: 0 };
  const [items, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);
  return { items, unreadCount };
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
