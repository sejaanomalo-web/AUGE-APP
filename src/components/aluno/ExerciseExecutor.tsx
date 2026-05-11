"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, ChevronUp, MoreVertical, Pause, Play } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { Progress } from "@/components/ui/Progress";
import { SetRow, type SetRowState } from "./SetRow";
import { RestTimerOverlay } from "./RestTimerOverlay";
import { formatDuration, formatKg } from "@/lib/utils";
import {
  abandonWorkout,
  finishWorkout,
  logSet,
} from "@/lib/actions/workout-logs";

export interface ExecutorExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  restSeconds: number;
  weightKgSuggested: number;
  imageUrl?: string | null;
  videoUrl?: string | null;
  instructions?: string | null;
}

function extractYoutubeId(url: string): string | null {
  const re =
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const m = url.match(re);
  return m ? m[1] : null;
}

export interface ExecutorSeed {
  exerciseId: string;
  sets: { setNumber: number; weight: number; reps: number; completed: boolean }[];
}

interface ExerciseProgress {
  prescribedExerciseId: string;
  exerciseId: string;
  sets: SetRowState[];
  skipped: boolean;
}

function buildInitial(
  exercises: ExecutorExercise[],
  seed?: ExecutorSeed[],
): ExerciseProgress[] {
  return exercises.map((p) => {
    const seedForEx = seed?.find((s) => s.exerciseId === p.exerciseId);
    const sets: SetRowState[] = Array.from({ length: p.sets }).map((_, i) => {
      const seedSet = seedForEx?.sets.find((s) => s.setNumber === i + 1);
      return {
        setNumber: i + 1,
        weightKg: seedSet?.weight ?? p.weightKgSuggested,
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

export function ExerciseExecutor({
  workoutLogId,
  sessionName,
  exercises,
  seed,
  startedAtIso,
}: {
  workoutLogId: string;
  sessionName: string;
  exercises: ExecutorExercise[];
  seed?: ExecutorSeed[];
  startedAtIso: string;
}) {
  const router = useRouter();
  const [state, setState] = React.useState<ExerciseProgress[]>(() =>
    buildInitial(exercises, seed),
  );
  const [currentIdx, setCurrentIdx] = React.useState(() => {
    if (!seed?.length) return 0;
    const firstIncomplete = buildInitial(exercises, seed).findIndex(
      (ex) => !ex.sets.every((s) => s.completed),
    );
    return firstIncomplete === -1 ? 0 : firstIncomplete;
  });
  const startedAtMs = React.useMemo(
    () => new Date(startedAtIso).getTime(),
    [startedAtIso],
  );
  const [now, setNow] = React.useState(() => Date.now());
  const [paused, setPaused] = React.useState(false);
  const [resting, setResting] = React.useState<number | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirmExit, setConfirmExit] = React.useState(false);
  const [showFinish, setShowFinish] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [instructionsOpen, setInstructionsOpen] = React.useState(false);

  React.useEffect(() => {
    if (paused || showFinish) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [paused, showFinish]);
  const elapsed = Math.max(0, Math.floor((now - startedAtMs) / 1000));

  const currentEx = exercises[currentIdx];
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
    // No persist on number edits; only on toggle.
  }

  async function toggleComplete(setIndex: number) {
    const setBefore = currentProgress.sets[setIndex];
    const nextCompleted = !setBefore.completed;
    setState((prev) =>
      prev.map((ex, i) =>
        i === currentIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === setIndex ? { ...s, completed: nextCompleted } : s,
              ),
            }
          : ex,
      ),
    );

    if (nextCompleted) {
      const isLastSet = setIndex === currentProgress.sets.length - 1;
      const isLastExercise = currentIdx === exercises.length - 1;
      if (!(isLastSet && isLastExercise)) {
        setResting(currentEx.restSeconds || 60);
      }
    }

    // Persist (fire-and-forget; UI updates optimistically)
    try {
      await logSet({
        workoutLogId,
        exerciseId: currentEx.exerciseId,
        setNumber: setBefore.setNumber,
        weight: setBefore.weightKg,
        reps: setBefore.reps,
        completed: nextCompleted,
      });
    } catch (err) {
      console.error("logSet failed", err);
    }
  }

  function goNext() {
    if (currentIdx < exercises.length - 1) {
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

  async function finalize() {
    setSubmitting(true);
    try {
      await finishWorkout(workoutLogId);
    } finally {
      setShowFinish(false);
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

  const totalVolume = state.reduce(
    (a, ex) =>
      a +
      ex.sets.reduce(
        (b, s) => b + (s.completed ? s.weightKg * s.reps : 0),
        0,
      ),
    0,
  );
  const completedSets = state.reduce(
    (a, ex) => a + ex.sets.filter((s) => s.completed).length,
    0,
  );

  const isLastExercise = currentIdx === exercises.length - 1;

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 px-4 lg:px-6 h-14 lg:h-16 bg-bg-base/95 backdrop-blur border-b border-border-subtle pt-[env(safe-area-inset-top)] box-content">
        <IconButton
          aria-label={paused ? "Retomar" : "Pausar"}
          onClick={() => setPaused((p) => !p)}
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

      <div className="px-4 lg:px-6 pt-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-micro uppercase tracking-[0.08em] text-text-secondary">
            Exercício {currentIdx + 1} de {exercises.length}
          </p>
          <p className="text-caption text-text-muted tnum">
            {doneSets}/{totalSets} séries
          </p>
        </div>
        <Progress value={overallPct} thin />
      </div>

      <div className="flex-1 px-4 lg:px-6 py-6 pb-44 lg:pb-24">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          <section className="text-center flex flex-col items-center gap-3">
            <Badge>{currentEx.muscleGroup}</Badge>
            <h1 className="text-training-exercise text-text-primary">
              {currentEx.exerciseName}
            </h1>

            {/* Media: image, then YouTube embed if no image, else placeholder */}
            {currentEx.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentEx.imageUrl}
                alt={currentEx.exerciseName}
                className="w-full max-w-[280px] aspect-[4/3] rounded-md object-cover shadow-md"
              />
            ) : currentEx.videoUrl && extractYoutubeId(currentEx.videoUrl) ? (
              <div className="w-full max-w-md aspect-video rounded-md overflow-hidden shadow-md bg-bg-elevated">
                <iframe
                  src={`https://www.youtube.com/embed/${extractYoutubeId(currentEx.videoUrl)}`}
                  title={currentEx.exerciseName}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div
                aria-hidden
                className="w-[200px] h-[200px] rounded-md bg-gradient-to-br from-bg-elevated to-bg-card border border-border-subtle flex items-center justify-center shadow-md"
              >
                <span className="text-[120px] leading-none font-bold text-accent/30 select-none">
                  {currentEx.muscleGroup === "Cardio" ? "🏃" : "💪"}
                </span>
              </div>
            )}

            <p className="text-training-label text-text-secondary tnum">
              {currentEx.sets} séries · {currentEx.reps} reps
              {currentEx.restSeconds > 0 && (
                <>
                  {" "}
                  · {formatDuration(currentEx.restSeconds)} descanso
                </>
              )}
            </p>
            {currentEx.weightKgSuggested > 0 && (
              <p className="text-caption text-text-muted tnum">
                Peso sugerido: {formatKg(currentEx.weightKgSuggested)}
              </p>
            )}

            {currentEx.instructions && (
              <div className="w-full">
                <button
                  type="button"
                  onClick={() => setInstructionsOpen((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-md bg-bg-elevated text-text-primary hover:bg-bg-hover transition-colors text-body font-semibold"
                >
                  <span>Instruções</span>
                  {instructionsOpen ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
                {instructionsOpen && (
                  <p className="mt-2 text-body text-text-secondary whitespace-pre-line text-left px-1">
                    {currentEx.instructions}
                  </p>
                )}
              </div>
            )}
          </section>

          <section aria-label="Séries" className="flex flex-col gap-3">
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

      {resting !== null && (
        <RestTimerOverlay
          durationSeconds={resting}
          onSkip={() => setResting(null)}
          onComplete={() => setResting(null)}
        />
      )}

      <Dialog
        open={confirmExit}
        onOpenChange={setConfirmExit}
        title="Encerrar treino?"
        description="O treino será marcado como abandonado. As séries já marcadas continuam salvas."
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
            disabled={submitting}
          >
            {submitting ? "Salvando..." : "Voltar para Hoje"}
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

      {/* placeholder ref for sessionName, in case future header copy uses it */}
      <span className="sr-only">{sessionName}</span>
    </div>
  );
}
