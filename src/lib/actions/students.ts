"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requirePersonal() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== "PERSONAL") throw new Error("Apenas personais");
  return userId;
}

export async function getMyStudents() {
  const trainerId = await requirePersonal();
  return prisma.trainerStudent.findMany({
    where: { trainerId, status: { in: ["ACTIVE", "PAUSED"] } },
    include: { student: true },
    orderBy: { startedAt: "desc" },
  });
}

export async function getStudentById(studentId: string) {
  const trainerId = await requirePersonal();
  const link = await prisma.trainerStudent.findFirst({
    where: { trainerId, studentId },
  });
  if (!link) throw new Error("Aluno não vinculado a você");

  return prisma.user.findUnique({
    where: { id: studentId },
    include: {
      bodyMetrics: { orderBy: { date: "desc" } },
      workoutLogs: {
        orderBy: { startedAt: "desc" },
        take: 30,
        include: { session: true },
      },
    },
  });
}

export async function pauseStudent(studentId: string) {
  const trainerId = await requirePersonal();
  await prisma.trainerStudent.updateMany({
    where: { trainerId, studentId },
    data: { status: "PAUSED" },
  });
  revalidatePath("/alunos");
}

export async function resumeStudent(studentId: string) {
  const trainerId = await requirePersonal();
  await prisma.trainerStudent.updateMany({
    where: { trainerId, studentId },
    data: { status: "ACTIVE" },
  });
  revalidatePath("/alunos");
}

export async function removeStudent(studentId: string) {
  const trainerId = await requirePersonal();
  await prisma.trainerStudent.updateMany({
    where: { trainerId, studentId },
    data: { status: "ENDED", endedAt: new Date() },
  });
  revalidatePath("/alunos");
}
