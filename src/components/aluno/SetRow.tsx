"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg p-3 transition-colors duration-200",
        state.completed
          ? "bg-success/10 ring-1 ring-success/30"
          : "bg-bg-elevated",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-full text-body font-bold shrink-0 tnum",
          state.completed
            ? "bg-success text-text-on-accent"
            : "bg-bg-card text-text-secondary",
        )}
      >
        {state.setNumber}
      </div>

      <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <label className="flex flex-col items-center gap-1 min-w-0">
          <span className="text-caption text-text-muted">Peso (kg)</span>
          <input
            type="number"
            inputMode="decimal"
            step={0.5}
            min={0}
            value={state.weightKg}
            onChange={(e) =>
              onChange({ ...state, weightKg: parseFloat(e.target.value) || 0 })
            }
            className="w-full text-center bg-bg-card text-text-primary border border-border-subtle rounded-md min-h-[56px] text-[28px] font-bold tnum focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-glow"
            aria-label={`Peso da série ${state.setNumber}`}
          />
        </label>
        <span aria-hidden className="text-h2 text-text-muted">
          ×
        </span>
        <label className="flex flex-col items-center gap-1 min-w-0">
          <span className="text-caption text-text-muted">Reps</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={state.reps}
            onChange={(e) =>
              onChange({ ...state, reps: parseInt(e.target.value) || 0 })
            }
            className="w-full text-center bg-bg-card text-text-primary border border-border-subtle rounded-md min-h-[56px] text-[28px] font-bold tnum focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-glow"
            aria-label={`Reps da série ${state.setNumber}`}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={onToggleComplete}
        aria-label={
          state.completed ? "Desmarcar série" : "Marcar série concluída"
        }
        aria-pressed={state.completed}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          state.completed
            ? "bg-accent text-text-on-accent"
            : "bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-hover ring-1 ring-border-subtle",
        )}
      >
        <Check size={22} strokeWidth={3} />
      </button>
    </div>
  );
}
