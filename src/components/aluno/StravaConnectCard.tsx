"use client";

import * as React from "react";
import { Activity, RefreshCw, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  disconnectStrava,
  triggerManualSync,
  type MyStravaStatus,
} from "@/lib/actions/strava";

function formatRelative(date: Date | null | undefined): string {
  if (!date) return "Nunca";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "Agora";
  if (m < 60) return `${m} min atrás`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h atrás`;
  const days = Math.round(h / 24);
  return `${days}d atrás`;
}

export function StravaConnectCard({ status }: { status: MyStravaStatus }) {
  const [busy, setBusy] = React.useState<"sync" | "disconnect" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  if (!status.connected) {
    return (
      <Card variant="default" className="flex items-center gap-4">
        <span
          className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FC4C02]/10 text-[#FC4C02]"
          aria-hidden
        >
          <Activity size={24} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-body-lg font-semibold text-text-primary">
            Strava
          </p>
          <p className="text-caption text-text-muted">
            Conecte para sincronizar corridas automaticamente
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            window.location.href = "/api/integrations/strava/authorize";
          }}
        >
          Conectar Strava
        </Button>
      </Card>
    );
  }

  const name = [status.athlete?.firstName, status.athlete?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || "Atleta Strava";

  async function onSync() {
    setBusy("sync");
    setError(null);
    try {
      await triggerManualSync();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao sincronizar");
    } finally {
      setBusy(null);
    }
  }

  async function onDisconnect() {
    if (!confirm("Desconectar sua conta do Strava?")) return;
    setBusy("disconnect");
    setError(null);
    try {
      const res = await fetch("/api/integrations/strava/disconnect", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Falha ao desconectar");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao desconectar");
      setBusy(null);
    }
  }

  return (
    <Card variant="default">
      <div className="flex items-center gap-4">
        <Avatar
          src={status.athlete?.profileImageUrl ?? undefined}
          name={name}
          size={48}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-body-lg font-semibold text-text-primary truncate">
              {name}
            </p>
            <Badge variant="concluido">Strava</Badge>
          </div>
          <p className="text-caption text-text-muted">
            Último sync: {formatRelative(status.lastSyncAt ?? null)}
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-body text-error" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="md"
          onClick={onSync}
          disabled={busy !== null}
        >
          <RefreshCw
            size={16}
            aria-hidden
            className={busy === "sync" ? "animate-spin" : undefined}
          />
          {busy === "sync" ? "Sincronizando..." : "Sincronizar agora"}
        </Button>
        <Button
          variant="destructive"
          size="md"
          onClick={onDisconnect}
          disabled={busy !== null}
        >
          <LogOut size={16} aria-hidden />
          Desconectar
        </Button>
      </div>
    </Card>
  );
}
