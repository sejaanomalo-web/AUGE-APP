import crypto from "node:crypto";

export const AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
export const TOKEN_URL = "https://www.strava.com/oauth/token";
export const SCOPES = "read,activity:read_all";

// Janela de validade do state OAuth (anti-replay).
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

export type StravaStatePayload = {
  userId: string;
  nonce: string;
  ts: number;
};

function b64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(s: string): Buffer {
  const norm = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = norm.length % 4 === 0 ? "" : "=".repeat(4 - (norm.length % 4));
  return Buffer.from(norm + pad, "base64");
}

function getStateSecret(): Buffer {
  const s = process.env.STRAVA_STATE_SECRET;
  if (!s) throw new Error("STRAVA_STATE_SECRET ausente");
  // aceita base64 mas cai pra utf8 se decodificação ficar curta
  const buf = Buffer.from(s, "base64");
  return buf.length >= 16 ? buf : Buffer.from(s, "utf8");
}

export function signState(payload: StravaStatePayload): string {
  const json = JSON.stringify(payload);
  const sig = crypto
    .createHmac("sha256", getStateSecret())
    .update(json)
    .digest();
  return `${b64url(json)}.${b64url(sig)}`;
}

export function verifyState(state: string): StravaStatePayload | null {
  if (!state || typeof state !== "string") return null;
  const parts = state.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  let json: string;
  try {
    json = fromB64url(payloadB64).toString("utf8");
  } catch {
    return null;
  }
  const expected = crypto
    .createHmac("sha256", getStateSecret())
    .update(json)
    .digest();
  const got = fromB64url(sigB64);
  if (
    expected.length !== got.length ||
    !crypto.timingSafeEqual(expected, got)
  ) {
    return null;
  }
  let parsed: StravaStatePayload;
  try {
    parsed = JSON.parse(json) as StravaStatePayload;
  } catch {
    return null;
  }
  if (
    !parsed ||
    typeof parsed.userId !== "string" ||
    typeof parsed.ts !== "number"
  ) {
    return null;
  }
  if (Date.now() - parsed.ts > STATE_MAX_AGE_MS) return null;
  return parsed;
}

function clientCreds() {
  const client_id = process.env.STRAVA_CLIENT_ID;
  const client_secret = process.env.STRAVA_CLIENT_SECRET;
  if (!client_id || !client_secret)
    throw new Error("STRAVA_CLIENT_ID/SECRET ausentes");
  return { client_id, client_secret };
}

export type StravaTokenExchange = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
  scope?: string;
  athlete: {
    id: number;
    firstname?: string;
    lastname?: string;
    profile?: string;
    profile_medium?: string;
  };
};

export async function exchangeCodeForTokens(
  code: string,
): Promise<StravaTokenExchange> {
  const { client_id, client_secret } = clientCreds();
  const body = new URLSearchParams({
    client_id,
    client_secret,
    code,
    grant_type: "authorization_code",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Strava token exchange falhou: ${res.status} ${text}`);
  }
  return (await res.json()) as StravaTokenExchange;
}

export type StravaTokenRefresh = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

export async function refreshTokens(
  refreshToken: string,
): Promise<StravaTokenRefresh> {
  const { client_id, client_secret } = clientCreds();
  const body = new URLSearchParams({
    client_id,
    client_secret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Strava token refresh falhou: ${res.status} ${text}`);
  }
  return (await res.json()) as StravaTokenRefresh;
}
