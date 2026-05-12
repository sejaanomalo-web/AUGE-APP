import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { WorkoutBuilder } from "@/components/personal/WorkoutBuilder";
import { requireRole } from "@/lib/auth-helpers";
import { getPlanById } from "@/lib/actions/workout-plans";
import { getExercises } from "@/lib/actions/exercises";
import { prisma } from "@/lib/prisma";

export default async function EditPlanoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const personal = await requireRole("PERSONAL");
  const { id } = await params;

  const [plan, exercises] = await Promise.all([
    getPlanById(id),
    getExercises(),
  ]);
  if (!plan || plan.trainerId !== personal.id) return notFound();

  const student = await prisma.user.findUnique({
    where: { id: plan.studentId },
    select: { id: true, name: true },
  });

  const students = student
    ? [{ id: student.id, name: student.name }]
    : [];

  const toIso = (d: Date | null | undefined) =>
    d ? new Date(d).toISOString().slice(0, 10) : "";

  return (
    <div className="max-w-5xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <Link href={`/treinos/${plan.id}`}>
          <IconButton aria-label="Voltar">
            <ChevronLeft size={20} />
          </IconButton>
        </Link>
        <div>
          <h1 className="text-h1 text-text-primary">Editar plano</h1>
          <p className="text-body text-text-secondary truncate">
            {plan.name} · {student?.name ?? ""}
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
        successRedirect={`/treinos/${plan.id}`}
        initialData={{
          planId: plan.id,
          studentId: plan.studentId,
          name: plan.name,
          description: plan.description ?? "",
          startDate: toIso(plan.startDate),
          endDate: toIso(plan.endDate),
          sessions: plan.sessions.map((s) => ({
            name: s.name,
            dayOfWeek: s.dayOfWeek ?? 1,
            exercises: s.exercises.map((e) => ({
              exerciseId: e.exerciseId,
              sets: e.sets,
              reps: e.reps,
              restSeconds: e.restSeconds ?? 0,
              weight: e.weight ?? 0,
              notes: e.notes ?? "",
            })),
          })),
        }}
      />
    </div>
  );
}
