"use client";

import * as React from "react";
import { Share, X } from "lucide-react";

export function InstallPWAPrompt() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    const isInStandaloneMode =
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone ===
          true) ||
      window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = localStorage.getItem("auge-pwa-prompt-dismissed");

    if (isIOS && !isInStandaloneMode && !dismissed) {
      setShow(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem("auge-pwa-prompt-dismissed", "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar ꓥuge"
      className="fixed bottom-20 left-4 right-4 lg:bottom-4 lg:right-4 lg:left-auto lg:max-w-sm z-40 bg-bg-card border border-accent/50 rounded-md p-4 shadow-lg animate-slide-up"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text-primary mb-1">
            Instale o ꓥuge no seu iPhone
          </p>
          <p className="text-caption text-text-secondary">
            Toque em <Share className="inline w-4 h-4 mx-1" aria-hidden /> e
            depois{" "}
            <span className="font-semibold text-accent">
              &quot;Adicionar à Tela de Início&quot;
            </span>{" "}
            para receber notificações de treino.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="p-1 hover:bg-bg-hover rounded shrink-0"
          aria-label="Dispensar"
        >
          <X className="w-4 h-4 text-text-muted" aria-hidden />
        </button>
      </div>
    </div>
  );
}
