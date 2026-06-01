import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForTokens,
  verifyState,
} from "@/lib/integrations/strava/oauth";
import { encryptToken } from "@/lib/integrations/strava/crypto";
import { syncRecentActivities } from "@/lib/integrations/strava/sync";

function back(status: "connected" | "denied" | "error", base?: string | null) {
  const baseUrl = base ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  return NextResponse.redirect(
    `${baseUrl.replace(/\/$/, "")}/perfil/integracoes?strava=${status}`,
  );
}

export async function GET(req: NextRequest) {
  const userId = await requireAuth();
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? null;
  if (error) return back("denied", baseUrl);
  if (!code || !state) return back("error", baseUrl);

  const payload = verifyState(state);
  if (!payload || payload.userId !== userId) return back("error", baseUrl);

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch (err) {
    console.error("[strava] callback exchange falhou", err);
    return back("error", baseUrl);
  }

  const stravaAthleteId = BigInt(tokens.athlete.id);
  const expiresAt = new Date(tokens.expires_at * 1000);
  const accessTokenEnc = encryptToken(tokens.access_token);
  const refreshTokenEnc = encryptToken(tokens.refresh_token);

  await prisma.stravaAccount.upsert({
    where: { userId },
    create: {
      userId,
      stravaAthleteId,
      accessToken: accessTokenEnc,
      refreshToken: refreshTokenEnc,
      expiresAt,
      scope: tokens.scope ?? "",
      firstName: tokens.athlete.firstname ?? null,
      lastName: tokens.athlete.lastname ?? null,
      profileImageUrl:
        tokens.athlete.profile ?? tokens.athlete.profile_medium ?? null,
    },
    update: {
      stravaAthleteId,
      accessToken: accessTokenEnc,
      refreshToken: refreshTokenEnc,
      expiresAt,
      scope: tokens.scope ?? "",
      firstName: tokens.athlete.firstname ?? null,
      lastName: tokens.athlete.lastname ?? null,
      profileImageUrl:
        tokens.athlete.profile ?? tokens.athlete.profile_medium ?? null,
    },
  });

  // Sync inicial — não bloqueia o redirect se falhar.
  try {
    await syncRecentActivities(userId, { perPage: 30 });
  } catch (err) {
    console.warn("[strava] sync inicial falhou (ignorado)", err);
  }

  return back("connected", baseUrl);
}
