import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { requireRole } from "@/lib/auth-helpers";
import { getPlanById } from "@/lib/actions/workout-plans";
import { prisma } from "@/lib/prisma";
import { formatLongDate } from "@/lib/date";
import { formatKg, formatDuration } from "@/lib/utils";

const DAY_NAMES = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export default async function TreinoPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const personal = await requireRole("PERSONAL");
  const { id } = await params;
  const plan = await getPlanById(id);
  if (!plan || plan.trainerId !== personal.id) return notFound();

  const student = await prisma.user.findUnique({
    where: { id: plan.studentId },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/treinos">
          <IconButton aria-label="Voltar">
            <ChevronLeft size={20} />
          </IconButton>
        </Link>
        <div className="flex-1 min-w-0">
          <Badge>{plan.sessions.length}x semana</Badge>
          <h1 className="mt-1 text-h1 text-text-primary truncate">
            {plan.name}
          </h1>
          <p className="text-caption text-text-muted">
            {formatLongDate(plan.startDate.toISOString())}
            {plan.endDate
              ? ` - ${formatLongDate(plan.endDate.toISOString())}`
              : ""}
          </p>
        </div>
        <Link href={`/treinos/${plan.id}/editar`}>
          <Button variant="secondary" size="sm">
            <Pencil size={14} aria-hidden /> Editar
          </Button>
        </Link>
      </header>

      {student && (
        <Card variant="default" className="mb-6 flex items-center gap-3">
          <Avatar
            src={student.avatarUrl ?? undefined}
            name={student.name}
            size={40}
          />
          <div className="flex-1 min-w-0">
            <p className="text-body-lg text-text-primary font-semibold truncate">
              {student.name}
            </p>
            <p className="text-caption text-text-muted truncate">
              {student.email}
            </p>
          </div>
          <Link
            href={`/alunos/${student.id}`}
            className="text-caption text-accent hover:underline"
          >
            Ver aluno
          </Link>
        </Card>
      )}

      {plan.sessions.length === 0 ? (
        <Card variant="default">
          <p className="text-body text-text-secondary">
            Este plano ainda não tem sessões. Edite-o para adicionar treinos.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {plan.sessions.map((s) => (
            <Card key={s.id} variant="default">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <Badge>
                    {s.dayOfWeek != null ? DAY_NAMES[s.dayOfWeek] : "Livre"}
                  </Badge>
                  <h2 className="mt-1 text-h2 text-text-primary">{s.name}</h2>
                  <p className="text-caption text-text-muted">
                    {s.exercises.length}{" "}
                    {s.exercises.length === 1 ? "exercício" : "exercícios"}
                  </p>
                </div>
              </div>
              <ul className="flex flex-col gap-2">
                {s.exercises.map((p, i) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 py-2 border-t border-border-subtle/60 first:border-t-0"
                  >
                    <span className="text-caption text-text-muted tnum w-6 shrink-0">
                      {i + 1}.
                    </span>
                    <span className="flex-1 text-body text-text-primary truncate">
                      {p.exercise.name}
                    </span>
                    <span className="text-caption text-text-secondary tnum shrink-0">
                      {p.sets}×{p.reps}
                      {p.weight && p.weight > 0
                        ? ` · ${formatKg(p.weight)}`
                        : ""}
                      {p.restSeconds && p.restSeconds > 0
                        ? ` · ${formatDuration(p.restSeconds)}`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
