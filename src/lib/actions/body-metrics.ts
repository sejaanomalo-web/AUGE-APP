"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notifyUser } from "@/lib/notifications/notify";

export async function addMetric(data: {
  date: Date;
  weight?: number;
  bodyFat?: number;
  measurements?: Record<string, number>;
  notes?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const metric = await prisma.bodyMetric.create({
    data: { ...data, studentId: userId },
  });

  // Notify trainer if linked
  const link = await prisma.trainerStudent.findFirst({
    where: { studentId: userId, status: "ACTIVE" },
    include: { student: true },
  });
  if (link) {
    notifyUser({
      userId: link.trainerId,
      type: "STUDENT_METRIC_ADDED",
      title: "Nova medida registrada",
      body: `${link.student.name} adicionou uma nova medida`,
      data: { studentId: userId, metricId: metric.id },
      url: `/alunos/${userId}`,
    }).catch(() => null);
  }

  revalidatePath("/medidas");
  revalidatePath("/evolucao");
  return metric;
}

export async function getMyMetrics() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  return prisma.bodyMetric.findMany({
    where: { studentId: userId },
    orderBy: { date: "desc" },
  });
}

export async function deleteMetric(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  await prisma.bodyMetric.deleteMany({ where: { id, studentId: userId } });
  revalidatePath("/medidas");
}
