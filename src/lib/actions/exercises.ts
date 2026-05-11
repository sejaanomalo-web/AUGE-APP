"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getExercises(filter?: {
  search?: string;
  muscleGroup?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  return prisma.exercise.findMany({
    where: {
      AND: [
        { OR: [{ isCustom: false }, { createdById: userId }] },
        filter?.muscleGroup ? { muscleGroup: filter.muscleGroup } : {},
        filter?.search
          ? { name: { contains: filter.search, mode: "insensitive" } }
          : {},
      ],
    },
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
  });
}

export async function createCustomExercise(data: {
  name: string;
  muscleGroup: string;
  instructions?: string;
  videoUrl?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== "PERSONAL") throw new Error("Apenas personais");

  const ex = await prisma.exercise.create({
    data: { ...data, isCustom: true, createdById: userId },
  });

  revalidatePath("/exercicios");
  return ex;
}

export async function updateExercise(
  id: string,
  data: Partial<{
    name: string;
    muscleGroup: string;
    instructions: string;
    videoUrl: string;
  }>,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  await prisma.exercise.updateMany({
    where: { id, createdById: userId, isCustom: true },
    data,
  });
  revalidatePath("/exercicios");
}

export async function deleteExercise(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const inUse = await prisma.sessionExercise.findFirst({ where: { exerciseId: id } });
  if (inUse) throw new Error("Exercício está em uso em algum treino");

  await prisma.exercise.deleteMany({
    where: { id, createdById: userId, isCustom: true },
  });
  revalidatePath("/exercicios");
}
