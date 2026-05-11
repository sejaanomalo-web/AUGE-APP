"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, MoreVertical, Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { Textarea } from "@/components/ui/Input";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  abandonWorkout,
  finishWorkout,
} from "@/lib/actions/workout-logs";

export interface FreeExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  prescribedSets: number;
  prescribedReps: string;
}

export function FreeWorkoutExecutor({
  workoutLogId,
  sessionName,
  exercises,
  startedAtIso,
}: {
  workoutLogId: string;
  sessionName: string;
  exercises: FreeExercise[];
  startedAtIso: string;
}) {
  const router = useRouter();
  const startedAtMs = React.useMemo(
    () => new Date(startedAtIso).getTime(),
    [startedAtIso],
  );
  const [now, setNow] = React.useState(() => Date.now());
  const [paused, setPaused] = React.useState(false);
  const [pausedAt, setPausedAt] = React.useState<number | null>(null);
  const [pausedTotal, setPausedTotal] = React.useState(0);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirmExit, setConfirmExit] = React.useState(false);
  const [finishOpen, setFinishOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [completed, setCompleted] = React.useState<Set<string>>(new Set());
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (paused || finishOpen) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [paused, finishOpen]);

  const elapsed = Math.max(
    0,
    Math.floor((now - startedAtMs - pausedTotal) / 1000),
  );

  function togglePause() {
    if (paused && pausedAt) {
      setPausedTotal((p) => p + (Date.now() - pausedAt));
      setPausedAt(null);
      setPaused(false);
    } else {
      setPausedAt(Date.now());
      setPaused(true);
    }
  }

  function toggleExercise(exerciseId: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
  }

  async function finalize() {
    setSubmitting(true);
    try {
      await finishWorkout(workoutLogId, {
        studentNotes: notes.trim() || undefined,
        completedExerciseIds: Array.from(completed),
      });
    } finally {
      router.push("/hoje");
      router.refresh();
    }
  }

  async function exitWithoutSaving() {
    setSubmitting(true);
    try {
      await abandonWorkout(workoutLogId);
    } finally {
      router.push("/hoje");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 px-4 lg:px-6 h-14 lg:h-16 bg-bg-base/95 backdrop-blur border-b border-border-subtle">
        <IconButton
          aria-label={paused ? "Retomar" : "Pausar"}
          onClick={togglePause}
        >
          {paused ? <Play size={20} /> : <Pause size={20} />}
        </IconButton>
        <p className="text-training-cta text-text-primary tnum font-bold">
          {formatDuration(elapsed)}
        </p>
        <div className="relative">
          <IconButton
            aria-label="Mais opções"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreVertical size={20} />
          </IconButton>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 w-52 bg-bg-card rounded-md shadow-lg p-2 z-20 animate-fade-in"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmExit(true);
                }}
                className="w-full text-left px-3 py-2 rounded-md text-body text-error hover:bg-error/10"
              >
                Encerrar sem salvar
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <p className="text-micro uppercase tracking-[0.08em] text-text-secondary mb-4">
          Modo livre · {sessionName}
        </p>
        <p
          className="text-[96px] sm:text-[140px] leading-none font-bold text-accent tnum"
          aria-live="polite"
        >
          {formatDuration(elapsed)}
        </p>
        <p className="mt-4 text-body-lg text-text-secondary text-center max-w-sm">
          {paused
            ? "Treino pausado. Toca play pra retomar."
            : "Treinando agora. Encerra quando terminar pra registrar o que você fez."}
        </p>

        <Button
          variant="primary"
          size="cta"
          onClick={() => setFinishOpen(true)}
          className="mt-10"
        >
          <Square size={16} aria-hidden className="fill-current" />
          Encerrar treino
        </Button>
      </div>

      <Dialog
        open={finishOpen}
        onOpenChange={(o) => !submitting && setFinishOpen(o)}
        title="O que você fez?"
        description="Marca os exercícios concluídos e adicione observações se quiser."
        className="max-w-[600px]"
      >
        <div className="flex flex-col gap-4">
          <div className="bg-bg-elevated rounded-md p-3 text-center">
            <p className="text-caption text-text-muted">Tempo total</p>
            <p className="text-h1 text-text-primary tnum">
              {formatDuration(elapsed)}
            </p>
          </div>

          {exercises.length > 0 && (
            <div>
              <p className="text-caption text-text-muted uppercase tracking-[0.06em] font-semibold mb-2">
                Exercícios prescritos
              </p>
              <ul className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto">
                {exercises.map((ex) => {
                  const done = completed.has(ex.exerciseId);
                  return (
                    <li key={ex.exerciseId}>
                      <button
                        type="button"
                        onClick={() => toggleExercise(ex.exerciseId)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors",
                          done
                            ? "bg-success/10 ring-1 ring-success/30"
                            : "bg-bg-elevated hover:bg-bg-hover",
                        )}
                      >
                        <div
                          className={cn(
                            "w-6 h-6 rounded shrink-0 flex items-center justify-center",
                            done
                              ? "bg-success text-text-on-accent"
                              : "bg-bg-card border border-border",
                          )}
                        >
                          {done && (
                            <Check
                              size={14}
                              strokeWidth={3}
                              aria-hidden
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-body text-text-primary font-medium truncate">
                            {ex.exerciseName}
                          </p>
                          <p className="text-caption text-text-muted">
                            {ex.muscleGroup} · {ex.prescribedSets} ×{" "}
                            {ex.prescribedReps}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div>
            <label
              htmlFor="free-notes"
              className="block text-caption text-text-muted uppercase tracking-[0.06em] font-semibold mb-2"
            >
              Observações
            </label>
            <Textarea
              id="free-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Como foi o treino? Algo doendo? Sentiu falta de algo?"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setFinishOpen(false)}
              disabled={submitting}
            >
              Voltar
            </Button>
            <Button
              variant="primary"
              size="cta"
              onClick={finalize}
              disabled={submitting}
            >
              {submitting ? "Salvando..." : "Finalizar"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={confirmExit}
        onOpenChange={(o) => !submitting && setConfirmExit(o)}
        title="Encerrar sem salvar?"
        description="O tempo será descartado e a sessão marcada como abandonada."
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setConfirmExit(false)}
              disabled={submitting}
            >
              Continuar treino
            </Button>
            <Button
              variant="destructive"
              size="md"
              onClick={exitWithoutSaving}
              disabled={submitting}
            >
              {submitting ? "Encerrando..." : "Encerrar"}
            </Button>
          </>
        }
      >
        <></>
      </Dialog>
    </div>
  );
}
