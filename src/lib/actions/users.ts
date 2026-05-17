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

// Standard result shape — Next.js sanitises thrown error messages on
// server actions in production builds. Returning a typed { ok, error }
// keeps the real message readable on the client.
export type ProfileResult<T = void> =
  | (T extends void ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

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
}): Promise<ProfileResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Não autenticado." };

    if (data.name !== undefined && !data.name.trim()) {
      return { ok: false, error: "Nome não pode ficar vazio." };
    }
    if (
      data.birthDate !== undefined &&
      data.birthDate !== null &&
      (!(data.birthDate instanceof Date) || Number.isNaN(data.birthDate.getTime()))
    ) {
      return { ok: false, error: "Data de nascimento inválida." };
    }
    if (
      data.height !== undefined &&
      data.height !== null &&
      (Number.isNaN(data.height) || data.height < 0 || data.height > 300)
    ) {
      return { ok: false, error: "Altura fora do intervalo (0-300 cm)." };
    }
    if (
      data.currentWeight !== undefined &&
      data.currentWeight !== null &&
      (Number.isNaN(data.currentWeight) ||
        data.currentWeight < 0 ||
        data.currentWeight > 500)
    ) {
      return { ok: false, error: "Peso fora do intervalo (0-500 kg)." };
    }

    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name.trim();
    if (data.phone !== undefined) update.phone = data.phone.trim() || null;
    if (data.birthDate !== undefined) update.birthDate = data.birthDate;
    if (data.height !== undefined) update.height = data.height;
    if (data.currentWeight !== undefined)
      update.currentWeight = data.currentWeight;
    if (data.goal !== undefined) update.goal = data.goal.trim() || null;
    if (data.cref !== undefined) update.cref = data.cref.trim() || null;
    if (data.sportsPracticed !== undefined)
      update.sportsPracticed = data.sportsPracticed;

    await prisma.user.update({ where: { id: userId }, data: update });
    revalidatePath("/perfil");
    revalidatePath("/conta");
    return { ok: true };
  } catch (err) {
    console.error("[updateProfile] failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao salvar perfil.",
    };
  }
}

export async function uploadAvatar(
  formData: FormData,
): Promise<ProfileResult<{ url: string }>> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Não autenticado." };

    const file = formData.get("file") as File | null;
    if (!file) return { ok: false, error: "Arquivo obrigatório." };
    if (!ALLOWED_AVATAR_MIMES.includes(file.type)) {
      return {
        ok: false,
        error: "Formato não permitido. Use JPG, PNG ou WebP.",
      };
    }
    if (file.size > MAX_AVATAR_SIZE) {
      return { ok: false, error: "Imagem maior que 3MB. Tente uma menor." };
    }

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
    if (error) {
      console.error("[uploadAvatar] supabase upload failed", error);
      return { ok: false, error: `Upload falhou: ${error.message}` };
    }

    const { data: pub } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(key);
    const url = `${pub.publicUrl}?v=${Date.now()}`;

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
    });

    revalidatePath("/perfil");
    revalidatePath("/conta");
    return { ok: true, data: { url } };
  } catch (err) {
    console.error("[uploadAvatar] failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao enviar a foto.",
    };
  }
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
