import { notFound } from "next/navigation";
import { ExerciseExecutor, type SeedSet } from "@/components/aluno/ExerciseExecutor";
import { activePlan, todayLog } from "@/lib/mock-data";

export default async function ExecutarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = activePlan.sessions.find((s) => s.id === id);
  if (!session) return notFound();

  // If today's in-progress log matches this session, seed with current state.
  const seed: SeedSet[] | undefined =
    todayLog && todayLog.sessionTemplateId === session.id
      ? todayLog.exercises.map((e) => ({
          prescribedExerciseId: e.prescribedExerciseId,
          sets: e.sets.map((s) => ({
            weightKg: s.weightKg,
            reps: s.reps,
            completed: s.completed,
          })),
        }))
      : undefined;

  return <ExerciseExecutor session={session} seed={seed} />;
}
