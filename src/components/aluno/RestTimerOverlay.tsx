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
          new Notification("Descanso concluído", {
            body: "Próxima série pronta.",
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

  const progress =
    durationSeconds > 0
      ? Math.max(0, Math.min(1, remaining / durationSeconds))
      : 0;
  const urgent = remaining <= 10;

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
        <div
          className="mt-6 rounded-full p-2"
          style={{
            background: `conic-gradient(${urgent ? "#FF6A2A" : "#B7FF2A"} ${progress * 360}deg, #171C23 0deg)`,
          }}
        >
          <div className="h-64 w-64 sm:h-72 sm:w-72 rounded-full bg-bg-base border border-border-subtle flex items-center justify-center shadow-xl">
            <p
              className={`text-[84px] sm:text-[96px] leading-none font-extrabold font-mono-num ${
                urgent ? "text-intensity" : "text-accent"
              }`}
              aria-live="polite"
            >
              {formatDuration(remaining)}
            </p>
          </div>
        </div>
        <p className="mt-3 text-body-lg text-text-secondary max-w-sm">
          Respire. A próxima série já vem.
        </p>

        <button
          type="button"
          onClick={onSkip}
          className="mt-12 bg-bg-elevated border border-border-subtle rounded-pill px-8 py-3 text-training-cta text-text-primary font-bold hover:bg-bg-hover transition"
        >
          Pular descanso
        </button>
      </div>
    </div>
  );
}
