"use client";

import * as React from "react";
import { formatDuration } from "@/lib/utils";

export function RestTimerOverlay({
  durationSeconds,
  onSkip,
  onComplete,
}: {
  durationSeconds: number;
  onSkip: () => void;
  onComplete: () => void;
}) {
  const [remaining, setRemaining] = React.useState(durationSeconds);

  React.useEffect(() => {
    if (remaining <= 0) {
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification("Descanso terminou ⏱️", {
            body: "Próxima série!",
            icon: "/icon-192.png",
            tag: "auge-rest-end",
          });
        } catch {
          // ignore
        }
      }
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([60, 30, 60]);
      }
      onComplete();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onComplete]);

  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center px-6 animate-fade-in"
    >
      {/* Heavy backdrop blur — content behind is recognizable but muted. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-bg-base/40 backdrop-blur-3xl"
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        <p className="text-stat-label uppercase text-text-muted">Descanso</p>
        <p
          className="mt-4 text-[120px] sm:text-[140px] leading-none italic font-extrabold text-accent font-mono-num"
          aria-live="polite"
        >
          {formatDuration(remaining)}
        </p>
        <p className="mt-3 text-body-lg text-text-secondary max-w-sm">
          Respire. A próxima série já vem.
        </p>

        <button
          type="button"
          onClick={onSkip}
          className="mt-12 glass-medium rounded-pill px-8 py-3 text-training-cta text-text-primary font-bold hover:bg-bg-hover transition"
        >
          Pular descanso
        </button>
      </div>
    </div>
  );
}
