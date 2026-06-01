import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import {
  AUTHORIZE_URL,
  SCOPES,
  signState,
} from "@/lib/integrations/strava/oauth";

export async function GET() {
  const userId = await requireAuth();

  const clientId = process.env.STRAVA_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!clientId || !baseUrl) {
    return NextResponse.json(
      { error: "Strava OAuth não configurado" },
      { status: 500 },
    );
  }

  const state = signState({
    userId,
    nonce: crypto.randomBytes(16).toString("hex"),
    ts: Date.now(),
  });

  const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/integrations/strava/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: SCOPES,
    state,
  });

  return NextResponse.redirect(`${AUTHORIZE_URL}?${params.toString()}`);
}
