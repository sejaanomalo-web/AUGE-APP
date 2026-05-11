"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@prisma/client";
import { consumeInviteCode } from "./invites";

const AVATAR_BUCKET = "avatars";
const ALLOWED_AVATAR_MIMES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_SIZE = 3 * 1024 * 1024;

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
  birthDate?: Date | null;
  height?: number | null;
  currentWeight?: number | null;
  goal?: string;
  cref?: string;
  sportsPracticed?: string[];
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.phone !== undefined) update.phone = data.phone || null;
  if (data.birthDate !== undefined) update.birthDate = data.birthDate;
  if (data.height !== undefined) update.height = data.height;
  if (data.currentWeight !== undefined) update.currentWeight = data.currentWeight;
  if (data.goal !== undefined) update.goal = data.goal || null;
  if (data.cref !== undefined) update.cref = data.cref || null;
  if (data.sportsPracticed !== undefined)
    update.sportsPracticed = data.sportsPracticed;

  await prisma.user.update({ where: { id: userId }, data: update });
  revalidatePath("/perfil");
  revalidatePath("/conta");
}

export async function uploadAvatar(formData: FormData): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Arquivo obrigatório");
  if (!ALLOWED_AVATAR_MIMES.includes(file.type))
    throw new Error("Formato não permitido (use JPG, PNG ou WebP)");
  if (file.size > MAX_AVATAR_SIZE) throw new Error("Imagem maior que 3MB");

  const ext = file.name.split(".").pop() || "jpg";
  const key = `${userId}/avatar.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(key, buffer, {
      contentType: file.type,
      upsert: true,
    });
  if (error) throw new Error(`Upload falhou: ${error.message}`);

  const { data: pub } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(key);
  // Cache-bust by appending timestamp
  const url = `${pub.publicUrl}?v=${Date.now()}`;

  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: url },
  });

  revalidatePath("/perfil");
  revalidatePath("/conta");
  return url;
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
