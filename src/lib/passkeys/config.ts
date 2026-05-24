/**
 * Centralised passkey (WebAuthn) configuration.
 *
 * The Relying Party ID is the apex domain the credentials are bound to.
 * It must exactly match the page's effective domain at the moment the
 * credential is created OR asserted, otherwise the browser refuses to
 * play. We accept it as an env var with sensible fallbacks so that the
 * same code works on Vercel preview URLs, the production host, and
 * localhost.
 *
 * Env vars expected on production (Vercel):
 *   NEXT_PUBLIC_PASSKEY_RP_ID    e.g. "auge.anomalo.app"
 *   NEXT_PUBLIC_PASSKEY_ORIGIN   e.g. "https://auge.anomalo.app"
 *   NEXT_PUBLIC_PASSKEY_RP_NAME  e.g. "Auge"
 */

const DEFAULT_RP_NAME = "Auge";

function fallbackHost(): { rpId: string; origin: string } {
  // Vercel sets VERCEL_URL on every deploy (preview + prod).
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return { rpId: vercelUrl, origin: `https://${vercelUrl}` };
  }
  return { rpId: "localhost", origin: "http://localhost:3000" };
}

export function getPasskeyConfig(): {
  rpId: string;
  rpName: string;
  origin: string;
} {
  const envRpId = process.env.NEXT_PUBLIC_PASSKEY_RP_ID?.trim();
  const envOrigin = process.env.NEXT_PUBLIC_PASSKEY_ORIGIN?.trim();
  const fb = fallbackHost();
  return {
    rpId: envRpId || fb.rpId,
    rpName: process.env.NEXT_PUBLIC_PASSKEY_RP_NAME?.trim() || DEFAULT_RP_NAME,
    origin: envOrigin || fb.origin,
  };
}
