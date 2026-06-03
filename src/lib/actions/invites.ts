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

type ValidationFailure = { valid: false; reason: string };
type ValidationSuccess = {
  valid: true;
  professionalName: string;
  professionalId: string;
  vertical: "TREINOS" | "NUTRICAO";
};
type ValidationResult = ValidationFailure | ValidationSuccess;

export async function validateInviteCode(
  code: string,
): Promise<ValidationResult> {
  const upper = code.toUpperCase();

  const trainerInvite = await prisma.inviteCode.findUnique({
    where: { code: upper },
    include: { trainer: true },
  });
  if (trainerInvite) {
    if (trainerInvite.status !== "ACTIVE")
      return { valid: false, reason: "Código já usado ou expirado" };
    if (trainerInvite.expiresAt < new Date())
      return { valid: false, reason: "Código expirado" };
    return {
      valid: true,
      professionalName: trainerInvite.trainer.name,
      professionalId: trainerInvite.trainerId,
      vertical: "TREINOS",
    };
  }

  const nutriInvite = await prisma.inviteCodeNutri.findUnique({
    where: { code: upper },
    include: { nutritionist: true },
  });
  if (nutriInvite) {
    if (nutriInvite.status !== "ACTIVE")
      return { valid: false, reason: "Código já usado ou expirado" };
    if (nutriInvite.expiresAt < new Date())
      return { valid: false, reason: "Código expirado" };
    return {
      valid: true,
      professionalName: nutriInvite.nutritionist.name,
      professionalId: nutriInvite.nutritionistId,
      vertical: "NUTRICAO",
    };
  }

  return { valid: false, reason: "Código não encontrado" };
}

export async function consumeInviteCode(code: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const validation = await validateInviteCode(code);
  if (!validation.valid) throw new Error(validation.reason);

  if (validation.vertical === "TREINOS") {
    return consumeTrainerInvite(code, userId);
  }
  return consumeNutritionistInvite(code, userId);
}

async function consumeTrainerInvite(code: string, studentId: string) {
  const upper = code.toUpperCase();
  const invite = await prisma.inviteCode.findUnique({ where: { code: upper } });
  if (!invite) throw new Error("Código não encontrado");

  // Re-link safe: if prior link is ENDED, reactivate it; if active/paused, refuse.
  const existing = await prisma.trainerStudent.findUnique({
    where: {
      trainerId_studentId: {
        trainerId: invite.trainerId,
        studentId,
      },
    },
  });

  if (existing && existing.status !== "ENDED") {
    throw new Error("Você já tem um vínculo ativo com este profissional");
  }

  await prisma.$transaction([
    prisma.inviteCode.update({
      where: { id: invite.id },
      data: { status: "USED", usedById: studentId, usedAt: new Date() },
    }),
    existing
      ? prisma.trainerStudent.update({
          where: { id: existing.id },
          data: {
            status: "ACTIVE",
            endedAt: null,
            inviteId: invite.id,
            startedAt: new Date(),
          },
        })
      : prisma.trainerStudent.create({
          data: {
            trainerId: invite.trainerId,
            studentId,
            inviteId: invite.id,
            status: "ACTIVE",
          },
        }),
  ]);

  notifyUser({
    userId: invite.trainerId,
    type: "STUDENT_INVITE_ACCEPTED",
    vertical: "TREINOS",
    title: "Novo aluno vinculado",
    body: "Um aluno acabou de se vincular usando seu código",
    data: { studentId },
    url: "/alunos",
  }).catch(() => null);

  return { professionalId: invite.trainerId, vertical: "TREINOS" as const };
}

async function consumeNutritionistInvite(code: string, studentId: string) {
  const upper = code.toUpperCase();
  const invite = await prisma.inviteCodeNutri.findUnique({
    where: { code: upper },
  });
  if (!invite) throw new Error("Código não encontrado");

  const existing = await prisma.nutritionistStudent.findUnique({
    where: {
      nutritionistId_studentId: {
        nutritionistId: invite.nutritionistId,
        studentId,
      },
    },
  });

  if (existing && existing.status !== "ENDED") {
    throw new Error("Você já tem um vínculo ativo com esta nutricionista");
  }

  await prisma.$transaction([
    prisma.inviteCodeNutri.update({
      where: { id: invite.id },
      data: { status: "USED", usedById: studentId, usedAt: new Date() },
    }),
    existing
      ? prisma.nutritionistStudent.update({
          where: { id: existing.id },
          data: {
            status: "ACTIVE",
            endedAt: null,
            inviteId: invite.id,
            startedAt: new Date(),
          },
        })
      : prisma.nutritionistStudent.create({
          data: {
            nutritionistId: invite.nutritionistId,
            studentId,
            inviteId: invite.id,
            status: "ACTIVE",
          },
        }),
  ]);

  notifyUser({
    userId: invite.nutritionistId,
    type: "NUTRI_INVITE_ACCEPTED",
    vertical: "NUTRICAO",
    title: "Novo aluno vinculado",
    body: "Um aluno acabou de se vincular usando seu código",
    data: { studentId },
    url: "/nutri/alunos",
  }).catch(() => null);

  return {
    professionalId: invite.nutritionistId,
    vertical: "NUTRICAO" as const,
  };
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
