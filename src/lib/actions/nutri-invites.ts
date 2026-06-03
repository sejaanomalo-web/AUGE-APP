"use server";

import { auth } from "@clerk/nextjs/server";
import { customAlphabet } from "nanoid";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const generateCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export async function createNutriInviteCode() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== "NUTRICIONISTA")
    throw new Error("Apenas nutricionistas podem criar convites");

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  const invite = await prisma.inviteCodeNutri.create({
    data: { code, nutritionistId: userId, expiresAt },
  });

  revalidatePath("/nutri/alunos");
  return invite;
}

export async function listMyNutriInvites() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  return prisma.inviteCodeNutri.findMany({
    where: { nutritionistId: userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function revokeNutriInvite(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  await prisma.inviteCodeNutri.updateMany({
    where: { id, nutritionistId: userId, status: "ACTIVE" },
    data: { status: "REVOKED" },
  });

  revalidatePath("/nutri/alunos");
}

export async function getMyAlunosNutri() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const links = await prisma.nutritionistStudent.findMany({
    where: { nutritionistId: userId, status: "ACTIVE" },
    orderBy: { startedAt: "desc" },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          birthDate: true,
        },
      },
    },
  });

  return links.map((l) => ({
    linkId: l.id,
    startedAt: l.startedAt,
    student: l.student,
  }));
}

export async function endNutritionistLink(linkId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  await prisma.nutritionistStudent.updateMany({
    where: { id: linkId, nutritionistId: userId, status: { not: "ENDED" } },
    data: { status: "ENDED", endedAt: new Date() },
  });

  revalidatePath("/nutri/alunos");
}
