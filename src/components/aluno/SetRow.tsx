"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { maskInt, maskDecimal, parseDecimalBR } from "@/lib/masks";
import { AnimatedSetButton } from "@/components/visual/AnimatedSetButton";

export interface SetRowState {
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
}

export function SetRow({
  state,
  onChange,
  onToggleComplete,
}: {
  state: SetRowState;
  onChange: (next: SetRowState) => void;
  onToggleComplete: () => void;
}) {
  // Rascunhos de texto para permitir digitar/colar só o formato permitido
  // (inteiro nas reps, decimal BR no peso) preservando o estado numérico.
  const [repsDraft, setRepsDraft] = React.useState(() => String(state.reps));
  const [weightDraft, setWeightDraft] = React.useState(() =>
    String(state.weightKg).replace(".", ","),
  );

  // Mantém o rascunho em sincronia quando o número muda por fora (ex.: seed).
  React.useEffect(() => {
    if ((parseDecimalBR(repsDraft) ?? 0) !== state.reps) {
      setRepsDraft(String(state.reps));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.reps]);
  React.useEffect(() => {
    if ((parseDecimalBR(weightDraft) ?? 0) !== state.weightKg) {
      setWeightDraft(String(state.weightKg).replace(".", ","));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.weightKg]);

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border p-4 transition-colors duration-200 pulse-line",
        state.completed
          ? "bg-success/10 border-success/35 shadow-[0_0_28px_-18px_rgba(57,255,136,0.75)]"
          : "bg-bg-surface border-border-subtle",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full font-bold text-h3 shrink-0 tnum border",
          state.completed
            ? "bg-success text-bg-base border-success"
            : "bg-bg-elevated text-text-muted border-border-subtle",
        )}
      >
        {state.setNumber}
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3 min-w-0">
        <label className="flex flex-col items-center gap-1 min-w-0">
          <span className="text-stat-label uppercase text-text-muted">
            Repetições
          </span>
          <input
            inputMode="numeric"
            value={repsDraft}
            onChange={(e) => {
              const masked = maskInt(e.target.value, 3);
              setRepsDraft(masked);
              onChange({ ...state, reps: parseInt(masked, 10) || 0 });
            }}
            className="w-full bg-transparent text-training-value font-mono-num text-text-primary text-center focus:outline-none"
            aria-label={`Repetições da série ${state.setNumber}`}
          />
        </label>
        <label className="flex flex-col items-center gap-1 min-w-0">
          <span className="text-stat-label uppercase text-text-muted">
            Kg
          </span>
          <input
            inputMode="decimal"
            value={weightDraft}
            onChange={(e) => {
              const masked = maskDecimal(e.target.value, {
                intDigits: 3,
                decimals: 1,
              });
              setWeightDraft(masked);
              onChange({ ...state, weightKg: parseDecimalBR(masked) ?? 0 });
            }}
            className="w-full bg-transparent text-training-value font-mono-num text-text-primary text-center focus:outline-none"
            aria-label={`Peso da série ${state.setNumber}`}
          />
        </label>
      </div>

      <AnimatedSetButton
        completed={state.completed}
        onToggle={onToggleComplete}
        ariaLabel={
          state.completed ? "Desmarcar série" : "Marcar série concluída"
        }
      />
    </div>
  );
}
