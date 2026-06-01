import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decryptToken, encryptToken } from "./crypto";
import { refreshTokens } from "./oauth";

// Margem de segurança: refresca quando faltam <60s pra expirar.
const REFRESH_MARGIN_MS = 60 * 1000;

export async function getValidAccessToken(userId: string): Promise<string> {
  const account = await prisma.stravaAccount.findUnique({ where: { userId } });
  if (!account) throw new Error("Strava não conectado");

  const expiresInMs = account.expiresAt.getTime() - Date.now();
  if (expiresInMs > REFRESH_MARGIN_MS) {
    return decryptToken(account.accessToken);
  }

  // Refresh com transação Serializable pra evitar dois refreshes simultâneos.
  const decryptedRefresh = decryptToken(account.refreshToken);
  const refreshed = await refreshTokens(decryptedRefresh);

  const newAccessEnc = encryptToken(refreshed.access_token);
  const newRefreshEnc = encryptToken(refreshed.refresh_token);
  const newExpiresAt = new Date(refreshed.expires_at * 1000);

  await prisma.$transaction(
    async (tx) => {
      await tx.stravaAccount.update({
        where: { userId },
        data: {
          accessToken: newAccessEnc,
          refreshToken: newRefreshEnc,
          expiresAt: newExpiresAt,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  return refreshed.access_token;
}

export async function fetchStrava(
  userId: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const token = await getValidAccessToken(userId);
  const url = path.startsWith("http")
    ? path
    : `https://www.strava.com${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...init, headers });
}
