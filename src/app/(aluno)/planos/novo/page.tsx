import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { WorkoutBuilder } from "@/components/personal/WorkoutBuilder";
import { requireRole } from "@/lib/auth-helpers";
import { getExercises } from "@/lib/actions/exercises";

export default async function NovoPlanoAlunoPage() {
  const me = await requireRole("ALUNO");
  const exercises = await getExercises();

  return (
    <div className="max-w-5xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/planos">
          <IconButton aria-label="Voltar">
            <ChevronLeft size={20} />
          </IconButton>
        </Link>
        <div>
          <h1 className="text-h1 text-text-primary">Novo plano de treino</h1>
          <p className="text-body text-text-secondary">
            Monte suas sessões e os exercícios que vai fazer.
          </p>
        </div>
      </header>
      <WorkoutBuilder
        students={[{ id: me.id, name: me.name }]}
        exercises={exercises.map((e) => ({
          id: e.id,
          name: e.name,
          muscleGroup: e.muscleGroup,
        }))}
        successRedirect="/planos"
      />
    </div>
  );
}
