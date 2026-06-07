import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/integrations/strava/client";

// Cron: refresca tokens com menos de 24h de validade pra não expirar offline.
const REFRESH_WINDOW_MS = 24 * 60 * 60 * 1000;

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const threshold = new Date(Date.now() + REFRESH_WINDOW_MS);
  const accounts = await prisma.stravaAccount.findMany({
    where: { expiresAt: { lte: threshold } },
    select: { userId: true },
  });

  let refreshed = 0;
  let failed = 0;
  for (const acc of accounts) {
    try {
      await getValidAccessToken(acc.userId);
      refreshed++;
    } catch (err) {
      failed++;
      console.error("[strava-refresh] falhou", acc.userId, err);
    }
  }

  return NextResponse.json({ count: refreshed, failed, total: accounts.length });
}
