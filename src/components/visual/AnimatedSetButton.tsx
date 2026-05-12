"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AnimatedSetButtonProps {
  completed: boolean;
  onToggle: () => void;
  ariaLabel?: string;
}

export function AnimatedSetButton({
  completed,
  onToggle,
  ariaLabel,
}: AnimatedSetButtonProps) {
  const [pulsing, setPulsing] = useState(false);

  function handleClick() {
    if (!completed) {
      setPulsing(true);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(50);
      }
      window.setTimeout(() => setPulsing(false), 600);
    }
    onToggle();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        ariaLabel ??
        (completed ? "Marcar como não feita" : "Marcar série completa")
      }
      className={cn(
        "relative w-14 h-14 rounded-full flex items-center justify-center transition duration-200 shrink-0",
        completed
          ? "bg-success text-bg-base scale-110"
          : "bg-bg-elevated text-text-muted hover:bg-bg-hover",
        pulsing && "animate-pulse-strong",
      )}
    >
      <Check
        size={28}
        strokeWidth={3}
        className={cn(
          "transition-transform",
          completed ? "scale-100" : "scale-0",
        )}
      />
      {pulsing && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-success animate-ping opacity-75"
        />
      )}
    </button>
  );
}
