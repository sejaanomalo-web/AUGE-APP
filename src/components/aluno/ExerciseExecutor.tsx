"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MoreVertical, Pause, Play } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { Progress } from "@/components/ui/Progress";
import { SetRow, type SetRowState } from "./SetRow";
import { RestTimerOverlay } from "./RestTimerOverlay";
import { formatDuration, formatKg } from "@/lib/utils";
import type { WorkoutSessionTemplate } from "@/lib/types";
import { exercisesById } from "@/lib/mock-data";

interface ExerciseProgress {
  prescribedExerciseId: string;
  exerciseId: string;
  sets: SetRowState[];
  skipped: boolean;
}

function initialState(
  session: WorkoutSessionTemplate,
  seed?: SeedSet[],
): ExerciseProgress[] {
  return session.exercises.map((p) => {
    const seedForEx = seed?.find((s) => s.prescribedExerciseId === p.id);
    const sets: SetRowState[] = Array.from({ length: p.sets }).map((_, i) => {
      const seedSet = seedForEx?.sets[i];
      return {
        setNumber: i + 1,
        weightKg: seedSet?.weightKg ?? p.weightKgSuggested,
        reps: seedSet?.reps ?? (parseInt(p.reps, 10) || 10),
        completed: seedSet?.completed ?? false,
      };
    });
    return {
      prescribedExerciseId: p.id,
      exerciseId: p.exerciseId,
      sets,
      skipped: false,
    };
  });
}

export interface SeedSet {
  prescribedExerciseId: string;
  sets: { weightKg: number; reps: number; completed: boolean }[];
}

export function ExerciseExecutor({
  session,
  seed,
}: {
  session: WorkoutSessionTemplate;
  seed?: SeedSet[];
}) {
  const router = useRouter();
  const [state, setState] = React.useState<ExerciseProgress[]>(() =>
    initialState(session, seed),
  );
  const [currentIdx, setCurrentIdx] = React.useState(() => {
    if (!seed) return 0;
    const firstIncomplete = initialState(session, seed).findIndex(
      (ex) => !ex.sets.every((s) => s.completed),
    );
    return firstIncomplete === -1 ? 0 : firstIncomplete;
  });
  const [elapsed, setElapsed] = React.useState(seed ? 12 * 60 + 34 : 0);
  const [paused, setPaused] = React.useState(false);
  const [resting, setResting] = React.useState<number | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirmExit, setConfirmExit] = React.useState(false);
  const [showFinish, setShowFinish] = React.useState(false);

  React.useEffect(() => {
    if (paused || showFinish) return;
    const i = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [paused, showFinish]);

  const currentEx = session.exercises[currentIdx];
  const currentMeta = exercisesById.get(currentEx.exerciseId);
  const currentProgress = state[currentIdx];

  const totalSets = state.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = state.reduce(
    (a, e) => a + e.sets.filter((s) => s.completed).length,
    0,
  );
  const overallPct = totalSets === 0 ? 0 : (doneSets / totalSets) * 100;

  function updateSet(setIndex: number, next: SetRowState) {
    setState((prev) =>
      prev.map((ex, i) =>
        i === currentIdx
          ? { ...ex, sets: ex.sets.map((s, j) => (j === setIndex ? next : s)) }
          : ex,
      ),
    );
  }

  function toggleComplete(setIndex: number) {
    const wasCompleted = currentProgress.sets[setIndex].completed;
    setState((prev) =>
      prev.map((ex, i) =>
        i === currentIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === setIndex ? { ...s, completed: !s.completed } : s,
              ),
            }
          : ex,
      ),
    );
    // Trigger rest timer when newly completed (not last set of last exercise)
    if (!wasCompleted) {
      const isLastSet = setIndex === currentProgress.sets.length - 1;
      const isLastExercise = currentIdx === session.exercises.length - 1;
      if (!(isLastSet && isLastExercise)) {
        setResting(currentEx.restSeconds);
      }
    }
  }

  function goNext() {
    if (currentIdx < session.exercises.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      setShowFinish(true);
    }
  }

  function skipExercise() {
    setState((prev) =>
      prev.map((ex, i) => (i === currentIdx ? { ...ex, skipped: true } : ex)),
    );
    goNext();
  }

  function finalize() {
    setShowFinish(false);
    router.push("/hoje");
  }

  const totalVolume = state.reduce(
    (a, ex) =>
      a + ex.sets.reduce((b, s) => b + (s.completed ? s.weightKg * s.reps : 0), 0),
    0,
  );
  const completedSets = state.reduce(
    (a, ex) => a + ex.sets.filter((s) => s.completed).length,
    0,
  );

  const isLastExercise = currentIdx === session.exercises.length - 1;

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Header sticky */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 px-4 lg:px-6 h-14 lg:h-16 bg-bg-base/95 backdrop-blur border-b border-border-subtle">
        <IconButton
          aria-label={paused ? "Retomar" : "Pausar"}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? <Play size={20} /> : <Pause size={20} />}
        </IconButton>
        <p
          aria-live="off"
          className="text-training-cta text-text-primary tnum font-bold"
        >
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
              className="absolute right-0 top-full mt-1 w-52 bg-bg-card rounded-lg shadow-lg p-2 z-20 animate-fade-in"
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

      {/* Progress global */}
      <div className="px-4 lg:px-6 pt-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-micro uppercase tracking-[0.08em] text-text-secondary">
            Exercício {currentIdx + 1} de {session.exercises.length}
          </p>
          <p className="text-caption text-text-muted tnum">
            {doneSets}/{totalSets} séries
          </p>
        </div>
        <Progress value={overallPct} thin />
      </div>

      {/* Current exercise */}
      <div className="flex-1 px-4 lg:px-6 py-6 pb-44 lg:pb-24">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          <section className="text-center flex flex-col items-center gap-3">
            <Badge>{currentMeta?.muscleGroup ?? ""}</Badge>
            <h1 className="text-training-exercise text-text-primary">
              {currentMeta?.name ?? "Exercício"}
            </h1>
            <div
              aria-hidden
              className="w-[200px] h-[200px] rounded-lg bg-gradient-to-br from-bg-elevated to-bg-card border border-border-subtle flex items-center justify-center"
            >
              <span className="text-[120px] leading-none font-bold text-accent/30 select-none">
                {currentEx.exerciseId.includes("agacha")
                  ? "🏋️"
                  : currentMeta?.muscleGroup === "Cardio"
                    ? "🏃"
                    : "💪"}
              </span>
            </div>
            <p className="text-training-label text-text-secondary tnum">
              {currentEx.sets} séries · {currentEx.reps} reps ·{" "}
              {formatDuration(currentEx.restSeconds)} descanso
            </p>
            {currentEx.weightKgSuggested > 0 && (
              <p className="text-caption text-text-muted tnum">
                Peso sugerido: {formatKg(currentEx.weightKgSuggested)}
              </p>
            )}
          </section>

          <section
            aria-label="Séries"
            className="flex flex-col gap-3"
          >
            {currentProgress.sets.map((s, i) => (
              <SetRow
                key={i}
                state={s}
                onChange={(next) => updateSet(i, next)}
                onToggleComplete={() => toggleComplete(i)}
              />
            ))}
          </section>
        </div>
      </div>

      {/* CTAs bottom sticky */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-bg-base/95 backdrop-blur border-t border-border-subtle px-4 lg:px-6 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={skipExercise}
            className="shrink-0"
          >
            Pular exercício
          </Button>
          <Button
            variant="primary"
            size="cta"
            fullWidth
            onClick={goNext}
            className="flex-1"
          >
            {isLastExercise ? "Finalizar treino" : "Próximo exercício"}
            {!isLastExercise && <ArrowRight size={18} aria-hidden />}
          </Button>
        </div>
      </div>

      {/* Rest timer */}
      {resting !== null && (
        <RestTimerOverlay
          durationSeconds={resting}
          onSkip={() => setResting(null)}
          onComplete={() => setResting(null)}
        />
      )}

      {/* Confirm exit */}
      <Dialog
        open={confirmExit}
        onOpenChange={setConfirmExit}
        title="Encerrar treino?"
        description="Seu progresso atual não será salvo. Tem certeza?"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setConfirmExit(false)}
            >
              Continuar treino
            </Button>
            <Button
              variant="destructive"
              size="md"
              onClick={() => router.push("/hoje")}
            >
              Encerrar
            </Button>
          </>
        }
      >
        <></>
      </Dialog>

      {/* Finish modal */}
      <Dialog
        open={showFinish}
        onOpenChange={setShowFinish}
        title={
          <span className="inline-flex items-center gap-2">
            Treino finalizado! <span aria-hidden>🎉</span>
          </span>
        }
        footer={
          <Button
            variant="primary"
            size="cta"
            onClick={finalize}
            fullWidth
          >
            Voltar para Hoje
          </Button>
        }
      >
        <dl className="grid grid-cols-2 gap-3">
          <div className="bg-bg-elevated rounded-md p-3">
            <dt className="text-caption text-text-muted">Tempo total</dt>
            <dd className="text-h2 text-text-primary tnum">
              {formatDuration(elapsed)}
            </dd>
          </div>
          <div className="bg-bg-elevated rounded-md p-3">
            <dt className="text-caption text-text-muted">Volume total</dt>
            <dd className="text-h2 text-text-primary tnum">
              {Math.round(totalVolume).toLocaleString("pt-BR")} kg
            </dd>
          </div>
          <div className="bg-bg-elevated rounded-md p-3 col-span-2">
            <dt className="text-caption text-text-muted">Séries</dt>
            <dd className="text-h2 text-text-primary tnum">
              {completedSets} de {totalSets} concluídas
            </dd>
          </div>
        </dl>
      </Dialog>
    </div>
  );
}
