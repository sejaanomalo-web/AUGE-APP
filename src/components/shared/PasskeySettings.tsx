"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Fingerprint,
  ScanFace,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startRegistration,
} from "@simplewebauthn/browser";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  getRegistrationOptions,
  verifyRegistration,
  removePasskey,
  type PasskeySummary,
} from "@/lib/actions/passkeys";

function defaultDeviceLabel(): string {
  if (typeof navigator === "undefined") return "Dispositivo";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "iPhone";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Android/.test(ua)) return "Android";
  if (/Windows/.test(ua)) return "Windows";
  return "Dispositivo";
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PasskeySettings({
  initialPasskeys,
}: {
  initialPasskeys: PasskeySummary[];
}) {
  const router = useRouter();
  const [passkeys, setPasskeys] = React.useState(initialPasskeys);
  const [supported, setSupported] = React.useState(true);
  const [platformAvailable, setPlatformAvailable] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSupported(browserSupportsWebAuthn());
    platformAuthenticatorIsAvailable()
      .then(setPlatformAvailable)
      .catch(() => setPlatformAvailable(false));
  }, []);

  async function handleEnroll() {
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const opts = await getRegistrationOptions();
      if (!opts.ok) {
        setError(opts.error);
        return;
      }
      let attestation;
      try {
        attestation = await startRegistration({ optionsJSON: opts.data });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Cadastro cancelado.",
        );
        return;
      }
      const res = await verifyRegistration(attestation, defaultDeviceLabel());
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(
        "Face ID ativado. A próxima vez que abrir o app, ele vai pedir desbloqueio.",
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id: string) {
    if (
      !confirm(
        "Remover este passkey? Você vai precisar cadastrar de novo se quiser usar Face ID neste dispositivo.",
      )
    )
      return;
    setError(null);
    setSuccess(null);
    setBusy(true);
    const snapshot = passkeys;
    setPasskeys((prev) => prev.filter((p) => p.id !== id));
    const res = await removePasskey(id);
    setBusy(false);
    if (!res.ok) {
      setPasskeys(snapshot);
      setError(res.error);
      return;
    }
    router.refresh();
  }

  if (!supported) {
    return (
      <Card variant="default">
        <p className="text-body text-text-secondary">
          Seu navegador não suporta Face ID / Touch ID para login. Use o
          Safari (iPhone/Mac) ou Chrome atualizado.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Card variant="default">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center shrink-0 text-accent">
            <ScanFace size={22} aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body-lg font-semibold text-text-primary">
              Desbloqueio biométrico
            </p>
            <p className="text-caption text-text-muted mt-0.5">
              Quando ativo, o app pede Face ID / Touch ID toda vez que você
              abre. Quem não tem biometria entra normalmente pelo login.
            </p>
            {!platformAvailable && (
              <p className="mt-2 text-caption text-warning">
                Este dispositivo não tem Face ID, Touch ID ou Windows Hello
                disponíveis. O cadastro vai falhar até você usar um
                dispositivo compatível.
              </p>
            )}
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleEnroll}
          disabled={busy || !platformAvailable}
          className="mt-4"
        >
          <Fingerprint size={16} aria-hidden />
          {busy ? "Cadastrando..." : "Ativar Face ID neste dispositivo"}
        </Button>

        {error && (
          <p className="mt-3 text-body text-error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-3 text-body text-success" role="status">
            {success}
          </p>
        )}
      </Card>

      {passkeys.length > 0 && (
        <Card variant="default" className="p-0">
          <div className="px-4 pt-4 pb-2">
            <p className="text-stat-label uppercase text-text-muted">
              Dispositivos cadastrados
            </p>
          </div>
          <ul>
            {passkeys.map((p, i) => (
              <li
                key={p.id}
                className={
                  i !== passkeys.length - 1
                    ? "border-b border-border-subtle"
                    : ""
                }
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center shrink-0 text-text-secondary">
                    <ShieldCheck size={16} aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body text-text-primary truncate">
                      {p.deviceLabel ?? "Dispositivo"}
                    </p>
                    <p className="text-caption text-text-muted truncate">
                      Cadastrado em {formatRelative(p.createdAtIso)} ·{" "}
                      último uso em {formatRelative(p.lastUsedAtIso)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(p.id)}
                    disabled={busy}
                    aria-label="Remover passkey"
                    className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-error hover:bg-error/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {passkeys.length === 0 && platformAvailable && (
        <div className="flex items-center gap-2 text-caption text-text-muted">
          <Check size={14} aria-hidden /> Nenhum passkey cadastrado - o app
          abre direto sem pedir biometria.
        </div>
      )}
    </div>
  );
}
