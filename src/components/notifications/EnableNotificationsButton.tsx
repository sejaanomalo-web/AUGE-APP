"use client";

import * as React from "react";
import { Bell, BellOff, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function EnableNotificationsButton() {
  const [permission, setPermission] =
    React.useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [supported, setSupported] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }
    setPermission(Notification.permission);

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    });
  }, []);

  async function enable() {
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return;

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        if (!VAPID_PUBLIC) {
          alert("VAPID_PUBLIC_KEY não configurada.");
          return;
        }
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        });
      }

      const p256dhBuf = sub.getKey("p256dh");
      const authBuf = sub.getKey("auth");
      if (!p256dhBuf || !authBuf) throw new Error("Invalid subscription keys");

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(p256dhBuf),
            auth: arrayBufferToBase64(authBuf),
          },
          userAgent: navigator.userAgent,
        }),
      });
      if (!res.ok) throw new Error("Failed to register subscription");

      setSubscribed(true);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Erro ao ativar notificações");
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => null);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }

  if (!supported) {
    return (
      <div className="text-text-muted text-body flex items-center gap-2">
        <BellOff className="w-4 h-4" aria-hidden />
        Notificações não suportadas neste dispositivo
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="text-error text-body">
        Notificações bloqueadas. Habilite nas configurações do navegador.
      </div>
    );
  }

  if (subscribed) {
    return (
      <Button
        variant="secondary"
        size="md"
        onClick={disable}
        disabled={loading}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          <Check size={16} className="text-success" aria-hidden />
        )}
        Notificações ativadas
      </Button>
    );
  }

  return (
    <Button variant="primary" size="md" onClick={enable} disabled={loading}>
      {loading ? (
        <Loader2 size={16} className="animate-spin" aria-hidden />
      ) : (
        <Bell size={16} aria-hidden />
      )}
      {loading ? "Ativando..." : "Ativar notificações"}
    </Button>
  );
}
