import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { disconnectStrava } from "@/lib/actions/strava";

export async function POST() {
  await requireAuth();
  await disconnectStrava();
  return NextResponse.json({ ok: true });
}
