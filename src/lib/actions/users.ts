"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@prisma/client";
import { consumeInviteCode } from "./invites";

/**
 * Ensure a User row exists for the current Clerk user. Useful as fallback
 * when the webhook hasn't fired yet (eg. first sign-in before webhook setup).
 */
export async function ensureUserRecord() {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "unknown@auge.app";
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    email.split("@")[0] ||
    "Usuário";

  return prisma.user.create({
    data: {
      id: userId,
      email,
      name,
      avatarUrl: clerkUser.imageUrl,
      role: null,
    },
  });
}

export async function setUserRole(
  role: UserRole,
  opts?: { cref?: string; inviteCode?: string },
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  await ensureUserRecord();

  await prisma.user.update({
    where: { id: userId },
    data: { role, cref: opts?.cref },
  });

  if (role === "ALUNO" && opts?.inviteCode) {
    await consumeInviteCode(opts.inviteCode);
  }

  revalidatePath("/");
  return { role };
}

export async function updateProfile(data: {
  name?: string;
  phone?: string;
  birthDate?: Date;
  height?: number;
  goal?: string;
  cref?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  await prisma.user.update({ where: { id: userId }, data });
  revalidatePath("/perfil");
}

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function getMyTrainer() {
  const { userId } = await auth();
  if (!userId) return null;

  const link = await prisma.trainerStudent.findFirst({
    where: { studentId: userId, status: "ACTIVE" },
    include: { trainer: true },
  });
  return link?.trainer ?? null;
}
