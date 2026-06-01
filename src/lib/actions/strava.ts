"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { syncRecentActivities } from "@/lib/integrations/strava/sync";
import { getValidAccessToken } from "@/lib/integrations/strava/client";

export type MyStravaStatus = {
  connected: boolean;
  athlete?: {
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  lastSyncAt?: Date | null;
};

export async function getMyStravaStatus(): Promise<MyStravaStatus> {
  const userId = await requireAuth();
  const account = await prisma.stravaAccount.findUnique({
    where: { userId },
    select: {
      firstName: true,
      lastName: true,
      profileImageUrl: true,
      lastSyncAt: true,
    },
  });
  if (!account) return { connected: false };
  return {
    connected: true,
    athlete: {
      firstName: account.firstName,
      lastName: account.lastName,
      profileImageUrl: account.profileImageUrl,
    },
    lastSyncAt: account.lastSyncAt,
  };
}

export async function triggerManualSync(): Promise<{ count: number }> {
  const userId = await requireAuth();
  const count = await syncRecentActivities(userId, { perPage: 30 });
  revalidatePath("/perfil/integracoes");
  return { count };
}

export async function disconnectStrava(): Promise<{ ok: true }> {
  const userId = await requireAuth();

  // Best-effort: avisa o Strava da revogação antes de remover localmente.
  try {
    const token = await getValidAccessToken(userId);
    await fetch("https://www.strava.com/oauth/deauthorize", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    console.warn("[strava] deauthorize falhou (ignorado)", err);
  }

  await prisma.stravaAccount.deleteMany({ where: { userId } });
  revalidatePath("/perfil/integracoes");
  return { ok: true };
}
