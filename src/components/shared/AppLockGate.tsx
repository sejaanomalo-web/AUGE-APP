"use client";

import * as React from "react";
import { Fingerprint, LogOut, ScanFace } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { startAuthentication } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/shared/Logo";
import {
  getAssertionOptions,
  verifyAssertion,
} from "@/lib/actions/passkeys";

/**
 * Key used in sessionStorage to remember "biometric verified" within
 * the current tab session. We intentionally use sessionStorage (not
 * localStorage) so the gate re-prompts on every fresh app launch -
 * which is the UX the user asked for.
 *
 * Also tracked: the timestamp of the last successful verify. If more
 * than UNLOCK_TTL_MS has passed (e.g. the tab was left open for hours
 * in the background), we re-prompt anyway.
 */
const UNLOCK_KEY = "auge.passkey.unlocked_at";
const UNLOCK_TTL_MS = 30 * 60 * 1000; // 30 min

function readUnlockedAt(): number | null {
  try {
    const v = window.sessionStorage.getItem(UNLOCK_KEY);
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeUnlockedAt(ts: number) {
  try {
    window.sessionStorage.setItem(UNLOCK_KEY, String(ts));
  } catch {
    /* private mode etc. - we just lose the cache */
  }
}

function isStillUnlocked(): boolean {
  const ts = readUnlockedAt();
  if (!ts) return false;
  return Date.now() - ts < UNLOCK_TTL_MS;
}

/**
 * Renders a fullscreen biometric prompt over the app whenever the
 * current user has at least one passkey enrolled AND the in-tab
 * unlock cache is empty or stale. Otherwise renders children
 * transparently.
 *
 * The actual biometric prompt only triggers on user gesture (Safari
 * requires it), so we surface a big "Desbloquear" button rather than
 * auto-firing on mount.
 */
export function AppLockGate({
  hasPasskey,
  children,
}: {
  hasPasskey: boolean;
  children: React.ReactNode;
}) {
  // We render children unconditionally on the server / first client
  // render to avoid hydration mismatch. Then on mount we decide whether
  // to overlay the gate.
  const [mounted, setMounted] = React.useState(false);
  const [unlocked, setUnlocked] = React.useState(true);
  const [verifying, setVerifying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { signOut } = useClerk();

  React.useEffect(() => {
    setMounted(true);
    if (!hasPasskey) {
      setUnlocked(true);
      return;
    }
    setUnlocked(isStillUnlocked());
  }, [hasPasskey]);

  // Re-prompt when the tab comes back from background after the TTL.
  React.useEffect(() => {
    if (!hasPasskey) return;
    function onVisibility() {
      if (document.visibilityState === "visible" && !isStillUnlocked()) {
        setUnlocked(false);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [hasPasskey]);

  async function handleUnlock() {
    setError(null);
    setVerifying(true);
    try {
      const opts = await getAssertionOptions();
      if (!opts.ok) {
        setError(opts.error);
        return;
      }
      let assertion;
      try {
        assertion = await startAuthentication({ optionsJSON: opts.data });
      } catch (err) {
        // User cancelled the native prompt, no biometric available, etc.
        const msg = err instanceof Error ? err.message : "Verificação cancelada.";
        setError(msg);
        return;
      }
      const res = await verifyAssertion(assertion);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      writeUnlockedAt(Date.now());
      setUnlocked(true);
    } finally {
      setVerifying(false);
    }
  }

  async function handleSignOut() {
    try {
      window.sessionStorage.removeItem(UNLOCK_KEY);
    } catch {
      /* ignore */
    }
    await signOut({ redirectUrl: "/" });
  }

  if (!mounted || !hasPasskey || unlocked) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Keep the underlying app mounted so re-render is instant once
       * the user unlocks. Hidden via aria-hidden + visibility for a11y. */}
      <div aria-hidden className="invisible">
        {children}
      </div>
      <div
        role="dialog"
        aria-modal
        aria-label="Desbloquear o app"
        className="fixed inset-0 z-[120] bg-bg-base flex items-center justify-center px-6"
      >
        <div className="w-full max-w-sm flex flex-col items-center text-center">
          <Logo className="h-10 w-auto mb-8" aria-hidden />
          <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mb-5">
            <ScanFace size={36} className="text-accent" aria-hidden />
          </div>
          <h1 className="text-h2 text-text-primary">App bloqueado</h1>
          <p className="mt-2 text-body text-text-secondary">
            Use Face ID ou Touch ID para continuar usando o Auge neste
            dispositivo.
          </p>

          {error && (
            <p className="mt-4 text-body text-error" role="alert">
              {error}
            </p>
          )}

          <Button
            variant="primary"
            size="lg"
            onClick={handleUnlock}
            disabled={verifying}
            className="mt-6 w-full"
          >
            <Fingerprint size={18} aria-hidden />
            {verifying ? "Verificando..." : "Desbloquear"}
          </Button>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-5 inline-flex items-center gap-2 text-caption font-semibold text-text-muted hover:text-text-secondary transition-colors"
          >
            <LogOut size={14} aria-hidden /> Sair desta conta
          </button>
        </div>
      </div>
    </>
  );
}
