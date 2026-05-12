"use client";

import { cn } from "@/lib/utils";
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
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border p-4 transition-colors duration-200",
        state.completed
          ? "bg-success/10 border-success/30"
          : "bg-bg-surface border-border-subtle",
      )}
    >
      {/* Caliber-style numbered indicator */}
      <div
        aria-hidden
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full font-bold text-h3 shrink-0 tnum",
          state.completed
            ? "bg-success text-bg-base"
            : "bg-bg-elevated text-text-muted",
        )}
      >
        {state.setNumber}
      </div>

      {/* Big italic inputs */}
      <div className="flex-1 grid grid-cols-2 gap-3 min-w-0">
        <label className="flex flex-col items-center gap-1 min-w-0">
          <span className="text-stat-label uppercase text-text-muted">
            Reps
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={state.reps}
            onChange={(e) =>
              onChange({ ...state, reps: parseInt(e.target.value) || 0 })
            }
            className="w-full bg-transparent text-training-value italic font-mono-num text-text-primary text-center focus:outline-none"
            aria-label={`Reps da série ${state.setNumber}`}
          />
        </label>
        <label className="flex flex-col items-center gap-1 min-w-0">
          <span className="text-stat-label uppercase text-text-muted">
            Kg
          </span>
          <input
            type="number"
            inputMode="decimal"
            step={0.5}
            min={0}
            value={state.weightKg}
            onChange={(e) =>
              onChange({ ...state, weightKg: parseFloat(e.target.value) || 0 })
            }
            className="w-full bg-transparent text-training-value italic font-mono-num text-text-primary text-center focus:outline-none"
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
