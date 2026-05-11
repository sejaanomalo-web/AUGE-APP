import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { WorkoutBuilder } from "@/components/personal/WorkoutBuilder";
import { requireRole } from "@/lib/auth-helpers";
import { getMyStudents } from "@/lib/actions/students";
import { getExercises } from "@/lib/actions/exercises";

export default async function NovoPlanoPage() {
  await requireRole("PERSONAL");
  const [links, exercises] = await Promise.all([
    getMyStudents(),
    getExercises(),
  ]);

  const students = links
    .filter((l) => l.status === "ACTIVE")
    .map((l) => ({ id: l.studentId, name: l.student.name }));

  return (
    <div className="max-w-5xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/treinos">
          <IconButton aria-label="Voltar">
            <ChevronLeft size={20} />
          </IconButton>
        </Link>
        <div>
          <h1 className="text-h1 text-text-primary">Novo plano de treino</h1>
          <p className="text-body text-text-secondary">
            Monte as sessões e prescreva os exercícios para o aluno.
          </p>
        </div>
      </header>
      <WorkoutBuilder
        students={students}
        exercises={exercises.map((e) => ({
          id: e.id,
          name: e.name,
          muscleGroup: e.muscleGroup,
        }))}
      />
    </div>
  );
}
