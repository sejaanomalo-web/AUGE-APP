import crypto from "node:crypto";

// AES-256-GCM com chave hex de 64 chars (= 32 bytes).
// Formato encoded: iv.tag.ciphertext (cada parte em base64 sem padding "=").

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;

function getKey(): Buffer {
  const hex = process.env.STRAVA_TOKEN_KEY;
  if (!hex) throw new Error("STRAVA_TOKEN_KEY ausente");
  const buf = Buffer.from(hex, "hex");
  if (buf.length !== 32)
    throw new Error("STRAVA_TOKEN_KEY deve ter 64 hex chars (32 bytes)");
  return buf;
}

function b64u(buf: Buffer): string {
  return buf.toString("base64").replace(/=+$/g, "");
}

function fromB64u(s: string): Buffer {
  // padding tolerante
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s + pad, "base64");
}

export function encryptToken(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${b64u(iv)}.${b64u(tag)}.${b64u(enc)}`;
}

export function decryptToken(encoded: string): string {
  const parts = encoded.split(".");
  if (parts.length !== 3) throw new Error("Token criptografado inválido");
  const [ivS, tagS, ctS] = parts;
  const key = getKey();
  const iv = fromB64u(ivS);
  const tag = fromB64u(tagS);
  const ct = fromB64u(ctS);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(ct), decipher.final()]);
  return dec.toString("utf8");
}
