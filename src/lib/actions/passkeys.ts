"use server";

import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/types";
import { prisma } from "@/lib/prisma";
import { getPasskeyConfig } from "@/lib/passkeys/config";

// [T] is wrapped in a tuple to make the conditional non-distributive
// across unions, so the result keeps a single, discriminable shape that
// callers can narrow with `if (res.ok)`.
export type PasskeyActionResult<T = void> = [T] extends [void]
  ? { ok: true } | { ok: false; error: string }
  : { ok: true; data: T } | { ok: false; error: string };

export interface PasskeySummary {
  id: string;
  deviceLabel: string | null;
  createdAtIso: string;
  lastUsedAtIso: string;
}

const REGISTRATION_CHALLENGE_COOKIE = "passkey_reg_challenge";
const ASSERTION_CHALLENGE_COOKIE = "passkey_auth_challenge";
const CHALLENGE_TTL_SECONDS = 5 * 60; // 5 min

function challengeCookieOpts() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: CHALLENGE_TTL_SECONDS,
  };
}

/**
 * Detects the "PasskeyCredential table doesn't exist" Prisma error -
 * what we get when the migration hasn't been applied yet. Lets us
 * report a clear error message instead of crashing.
 */
function isPasskeyTableMissing(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    (err.code === "P2021" || err.code === "P2022")
  );
}

/**
 * Returns the user's enrolled passkeys (metadata only; never the public
 * key) so the manage-passkeys UI can list and remove them. Returns an
 * empty array when the user has none OR the table hasn't been migrated.
 */
export async function listMyPasskeys(): Promise<PasskeySummary[]> {
  const { userId } = await auth();
  if (!userId) return [];
  try {
    const rows = await prisma.passkeyCredential.findMany({
      where: { userId },
      select: {
        id: true,
        deviceLabel: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      deviceLabel: r.deviceLabel,
      createdAtIso: r.createdAt.toISOString(),
      lastUsedAtIso: r.lastUsedAt.toISOString(),
    }));
  } catch (err) {
    if (isPasskeyTableMissing(err)) {
      console.warn(
        "[listMyPasskeys] PasskeyCredential missing - apply migration 20260524_passkey_credentials.",
      );
      return [];
    }
    throw err;
  }
}

/**
 * Build a WebAuthn registration challenge bound to the current user.
 * Excludes credentials already enrolled by them so the browser warns
 * before duplicating. Challenge is stashed in an httpOnly cookie that
 * the verification step reads back.
 */
export async function getRegistrationOptions(): Promise<
  PasskeyActionResult<PublicKeyCredentialCreationOptionsJSON>
> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Não autenticado." };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) return { ok: false, error: "Usuário não encontrado." };

    const cfg = getPasskeyConfig();

    let existing: Array<{ credentialId: string; transports: string[] }> = [];
    try {
      existing = await prisma.passkeyCredential.findMany({
        where: { userId },
        select: { credentialId: true, transports: true },
      });
    } catch (err) {
      if (!isPasskeyTableMissing(err)) throw err;
      return {
        ok: false,
        error:
          "Tabela de passkeys ainda não migrada. Aplique 20260524_passkey_credentials.",
      };
    }

    const options = await generateRegistrationOptions({
      rpName: cfg.rpName,
      rpID: cfg.rpId,
      userID: new TextEncoder().encode(user.id),
      userName: user.email,
      userDisplayName: user.name,
      attestationType: "none",
      // Force the platform authenticator (Face ID / Touch ID / Windows
      // Hello) - we intentionally don't want USB keys for the "unlock
      // the app with your face" UX.
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "preferred",
        userVerification: "required",
      },
      excludeCredentials: existing.map((c) => ({
        id: c.credentialId,
        transports: c.transports as AuthenticatorTransportFuture[],
      })),
      timeout: 60_000,
    });

    const c = await cookies();
    c.set(REGISTRATION_CHALLENGE_COOKIE, options.challenge, challengeCookieOpts());

    return { ok: true, data: options };
  } catch (err) {
    console.error("[getRegistrationOptions] failed", err);
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Erro ao iniciar cadastro do passkey.",
    };
  }
}

export async function verifyRegistration(
  response: RegistrationResponseJSON,
  deviceLabel?: string,
): Promise<PasskeyActionResult<{ id: string }>> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Não autenticado." };

    const c = await cookies();
    const expectedChallenge = c.get(REGISTRATION_CHALLENGE_COOKIE)?.value;
    if (!expectedChallenge) {
      return {
        ok: false,
        error: "Sessão expirada. Tente cadastrar o passkey novamente.",
      };
    }

    const cfg = getPasskeyConfig();
    let verification: VerifiedRegistrationResponse;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: cfg.origin,
        expectedRPID: cfg.rpId,
        requireUserVerification: true,
      });
    } catch (err) {
      console.error("[verifyRegistration] webauthn verify failed", err);
      return {
        ok: false,
        error: "Não consegui validar o passkey. Tente novamente.",
      };
    }

    c.delete(REGISTRATION_CHALLENGE_COOKIE);

    if (!verification.verified || !verification.registrationInfo) {
      return { ok: false, error: "Passkey não foi validado." };
    }

    const info = verification.registrationInfo;
    try {
      const row = await prisma.passkeyCredential.create({
        data: {
          userId,
          credentialId: info.credential.id,
          publicKey: Buffer.from(info.credential.publicKey).toString(
            "base64url",
          ),
          counter: BigInt(info.credential.counter),
          transports: (info.credential.transports ?? []) as string[],
          deviceLabel: deviceLabel?.trim() || null,
        },
        select: { id: true },
      });
      return { ok: true, data: { id: row.id } };
    } catch (err) {
      if (isPasskeyTableMissing(err)) {
        return {
          ok: false,
          error:
            "Tabela de passkeys ainda não migrada. Aplique 20260524_passkey_credentials.",
        };
      }
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return {
          ok: false,
          error: "Este passkey já está cadastrado.",
        };
      }
      throw err;
    }
  } catch (err) {
    console.error("[verifyRegistration] failed", err);
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Erro ao cadastrar o passkey.",
    };
  }
}

/**
 * Build a WebAuthn assertion challenge for unlocking the app. Returns
 * the allowCredentials list of the current user's enrolled passkeys so
 * the browser knows which credentials it can use.
 */
export async function getAssertionOptions(): Promise<
  PasskeyActionResult<PublicKeyCredentialRequestOptionsJSON>
> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Não autenticado." };

    let credentials: Array<{ credentialId: string; transports: string[] }> = [];
    try {
      credentials = await prisma.passkeyCredential.findMany({
        where: { userId },
        select: { credentialId: true, transports: true },
      });
    } catch (err) {
      if (isPasskeyTableMissing(err)) {
        return { ok: false, error: "Tabela de passkeys ainda não migrada." };
      }
      throw err;
    }

    if (credentials.length === 0) {
      return { ok: false, error: "Nenhum passkey cadastrado." };
    }

    const cfg = getPasskeyConfig();
    const options = await generateAuthenticationOptions({
      rpID: cfg.rpId,
      userVerification: "required",
      allowCredentials: credentials.map((c) => ({
        id: c.credentialId,
        transports: c.transports as AuthenticatorTransportFuture[],
      })),
      timeout: 60_000,
    });

    const c = await cookies();
    c.set(ASSERTION_CHALLENGE_COOKIE, options.challenge, challengeCookieOpts());

    return { ok: true, data: options };
  } catch (err) {
    console.error("[getAssertionOptions] failed", err);
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Erro ao iniciar desbloqueio.",
    };
  }
}

export async function verifyAssertion(
  response: AuthenticationResponseJSON,
): Promise<PasskeyActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Não autenticado." };

    const c = await cookies();
    const expectedChallenge = c.get(ASSERTION_CHALLENGE_COOKIE)?.value;
    if (!expectedChallenge) {
      return { ok: false, error: "Desafio expirado. Tente novamente." };
    }

    const credential = await prisma.passkeyCredential.findUnique({
      where: { credentialId: response.id },
    });
    if (!credential || credential.userId !== userId) {
      return { ok: false, error: "Credencial desconhecida." };
    }

    const cfg = getPasskeyConfig();
    let verification: VerifiedAuthenticationResponse;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: cfg.origin,
        expectedRPID: cfg.rpId,
        requireUserVerification: true,
        credential: {
          id: credential.credentialId,
          publicKey: Buffer.from(credential.publicKey, "base64url"),
          counter: Number(credential.counter),
          transports: credential.transports as AuthenticatorTransportFuture[],
        },
      });
    } catch (err) {
      console.error("[verifyAssertion] webauthn verify failed", err);
      return {
        ok: false,
        error: "Falha na verificação do passkey.",
      };
    }

    c.delete(ASSERTION_CHALLENGE_COOKIE);

    if (!verification.verified) {
      return { ok: false, error: "Verificação não passou." };
    }

    // Persist new counter + lastUsedAt so cloning detection works on
    // the next assertion.
    await prisma.passkeyCredential.update({
      where: { id: credential.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    });

    return { ok: true };
  } catch (err) {
    console.error("[verifyAssertion] failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao desbloquear.",
    };
  }
}

export async function removePasskey(
  id: string,
): Promise<PasskeyActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Não autenticado." };

    const result = await prisma.passkeyCredential.deleteMany({
      where: { id, userId },
    });
    if (result.count === 0) {
      return { ok: false, error: "Passkey não encontrado." };
    }
    return { ok: true };
  } catch (err) {
    console.error("[removePasskey] failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao remover passkey.",
    };
  }
}
