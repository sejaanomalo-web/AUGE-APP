"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPlan(data: {
  studentId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const link = await prisma.trainerStudent.findFirst({
    where: { trainerId: userId, studentId: data.studentId, status: "ACTIVE" },
  });
  if (!link) throw new Error("Aluno não vinculado");

  const plan = await prisma.workoutPlan.create({
    data: { ...data, trainerId: userId, isActive: true },
  });

  revalidatePath("/treinos");
  return plan;
}

export async function updatePlan(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  }>,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  await prisma.workoutPlan.updateMany({
    where: { id, trainerId: userId },
    data,
  });

  revalidatePath("/treinos");
}

export async function deletePlan(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  await prisma.workoutPlan.deleteMany({ where: { id, trainerId: userId } });
  revalidatePath("/treinos");
}

export async function getActivePlanForStudent(studentId: string) {
  return prisma.workoutPlan.findFirst({
    where: { studentId, isActive: true },
    include: {
      sessions: {
        orderBy: { order: "asc" },
        include: {
          exercises: {
            orderBy: { order: "asc" },
            include: { exercise: true },
          },
        },
      },
    },
  });
}

export async function getMyPlans() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  return prisma.workoutPlan.findMany({
    where: { trainerId: userId },
    include: { sessions: { include: { exercises: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPlanById(id: string) {
  return prisma.workoutPlan.findUnique({
    where: { id },
    include: {
      sessions: {
        orderBy: { order: "asc" },
        include: {
          exercises: {
            orderBy: { order: "asc" },
            include: { exercise: true },
          },
        },
      },
    },
  });
}
