import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncSingleActivity } from "@/lib/integrations/strava/sync";

// GET — handshake de subscription do Strava.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN
  ) {
    return NextResponse.json({ "hub.challenge": challenge });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

type StravaWebhookEvent = {
  object_type?: string;
  object_id?: number | string;
  owner_id?: number | string;
  aspect_type?: string;
};

// POST — eventos. Responder 200 rápido; sync em background.
export async function POST(req: Request) {
  let body: StravaWebhookEvent;
  try {
    body = (await req.json()) as StravaWebhookEvent;
  } catch {
    return new NextResponse(null, { status: 200 });
  }

  if (body.object_type !== "activity" || body.aspect_type === "delete") {
    return new NextResponse(null, { status: 200 });
  }

  const ownerId = body.owner_id;
  const objectId = body.object_id;
  if (ownerId === undefined || objectId === undefined) {
    return new NextResponse(null, { status: 200 });
  }

  try {
    const account = await prisma.stravaAccount.findUnique({
      where: { stravaAthleteId: BigInt(ownerId) },
      select: { userId: true },
    });
    if (!account) return new NextResponse(null, { status: 200 });

    // Fire-and-forget: o Strava espera 200 em <2s.
    void syncSingleActivity(account.userId, BigInt(objectId)).catch((err) => {
      console.error("[strava] webhook sync falhou", err);
    });
  } catch (err) {
    console.error("[strava] webhook lookup falhou", err);
  }

  return new NextResponse(null, { status: 200 });
}
