import { PageHeader } from "@/components/shared/PageHeader";
import { ExerciciosClient } from "@/components/personal/ExerciciosClient";
import { requireRole } from "@/lib/auth-helpers";
import { getExercises } from "@/lib/actions/exercises";

export default async function ExerciciosPage() {
  await requireRole("PERSONAL");
  const exercises = await getExercises();

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Exercícios"
        subtitle={`${exercises.length} exercícios na biblioteca`}
      />
      <ExerciciosClient
        exercises={exercises.map((e) => ({
          id: e.id,
          name: e.name,
          muscleGroup: e.muscleGroup,
          isCustom: e.isCustom,
        }))}
      />
    </div>
  );
}
