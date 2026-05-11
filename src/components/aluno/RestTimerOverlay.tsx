"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
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
      className="fixed inset-0 z-50 bg-bg-base/95 backdrop-blur-md flex flex-col items-center justify-center px-6 animate-fade-in"
    >
      <p className="text-micro uppercase tracking-[0.08em] text-text-secondary">
        Descanso
      </p>
      <p
        className="mt-4 text-[96px] sm:text-[120px] leading-none font-bold text-accent tnum"
        aria-live="polite"
      >
        {formatDuration(remaining)}
      </p>
      <p className="mt-2 text-body-lg text-text-secondary">
        Respire. A próxima série já vem.
      </p>
      <div className="mt-10 w-full max-w-xs">
        <Button variant="primary" size="cta" fullWidth onClick={onSkip}>
          Pular descanso
        </Button>
      </div>
    </div>
  );
}
