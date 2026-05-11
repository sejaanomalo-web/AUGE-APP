import { notFound } from "next/navigation";
import {
  ExerciseExecutor,
  type ExecutorExercise,
  type ExecutorSeed,
} from "@/components/aluno/ExerciseExecutor";
import { requireRole } from "@/lib/auth-helpers";
import { getSessionById } from "@/lib/actions/workout-sessions";
import { startWorkout } from "@/lib/actions/workout-logs";
import { prisma } from "@/lib/prisma";

export default async function ExecutarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ALUNO");
  const { id } = await params;
  const session = await getSessionById(id);
  if (!session || session.exercises.length === 0) return notFound();

  const log = await startWorkout(id);

  const existingLogs = await prisma.exerciseLog.findMany({
    where: { workoutLogId: log.id },
  });

  const exercises: ExecutorExercise[] = session.exercises.map((p) => ({
    id: p.id,
    exerciseId: p.exerciseId,
    exerciseName: p.exercise.name,
    muscleGroup: p.exercise.muscleGroup,
    sets: p.sets,
    reps: p.reps,
    restSeconds: p.restSeconds ?? 60,
    weightKgSuggested: p.weight ?? 0,
  }));

  const seedMap = new Map<string, ExecutorSeed>();
  for (const el of existingLogs) {
    if (el.setNumber === 0) continue;
    const cur = seedMap.get(el.exerciseId) ?? {
      exerciseId: el.exerciseId,
      sets: [],
    };
    cur.sets.push({
      setNumber: el.setNumber,
      weight: el.weight ?? 0,
      reps: el.reps ?? 0,
      completed: el.completed,
    });
    seedMap.set(el.exerciseId, cur);
  }
  const seed = Array.from(seedMap.values());

  return (
    <ExerciseExecutor
      workoutLogId={log.id}
      sessionName={session.name}
      exercises={exercises}
      seed={seed.length > 0 ? seed : undefined}
      startedAtIso={log.startedAt.toISOString()}
    />
  );
}
