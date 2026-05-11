"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { customAlphabet } from "nanoid";
import { notifyUser } from "@/lib/notifications/notify";

const generateCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export async function createInviteCode() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== "PERSONAL")
    throw new Error("Apenas personais podem criar convites");

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  const invite = await prisma.inviteCode.create({
    data: { code, trainerId: userId, expiresAt },
  });

  revalidatePath("/alunos");
  return invite;
}

export async function validateInviteCode(code: string) {
  const invite = await prisma.inviteCode.findUnique({
    where: { code: code.toUpperCase() },
    include: { trainer: true },
  });

  if (!invite) return { valid: false as const, reason: "Código não encontrado" };
  if (invite.status !== "ACTIVE")
    return { valid: false as const, reason: "Código já usado ou expirado" };
  if (invite.expiresAt < new Date())
    return { valid: false as const, reason: "Código expirado" };

  return {
    valid: true as const,
    trainerName: invite.trainer.name,
    trainerId: invite.trainerId,
  };
}

export async function consumeInviteCode(code: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const validation = await validateInviteCode(code);
  if (!validation.valid) throw new Error(validation.reason);

  const invite = await prisma.inviteCode.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!invite) throw new Error("Código não encontrado");

  await prisma.$transaction([
    prisma.inviteCode.update({
      where: { id: invite.id },
      data: { status: "USED", usedById: userId, usedAt: new Date() },
    }),
    prisma.trainerStudent.create({
      data: {
        trainerId: invite.trainerId,
        studentId: userId,
        inviteId: invite.id,
        status: "ACTIVE",
      },
    }),
  ]);

  // Notifica personal
  notifyUser({
    userId: invite.trainerId,
    type: "STUDENT_INVITE_ACCEPTED",
    title: "Novo aluno vinculado",
    body: "Um aluno acabou de se vincular usando seu código",
    data: { studentId: userId },
    url: "/alunos",
  }).catch(() => null);

  return { trainerId: invite.trainerId };
}

export async function listMyInvites() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  return prisma.inviteCode.findMany({
    where: { trainerId: userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function revokeInvite(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  await prisma.inviteCode.updateMany({
    where: { id, trainerId: userId, status: "ACTIVE" },
    data: { status: "REVOKED" },
  });

  revalidatePath("/alunos");
}
