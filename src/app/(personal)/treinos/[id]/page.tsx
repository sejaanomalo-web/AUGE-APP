import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import {
  activePlan,
  alunosSummary,
  exercisesById,
  personalPlans,
} from "@/lib/mock-data";
import { formatLongDate } from "@/lib/date";
import { formatKg, formatDuration } from "@/lib/utils";

export default async function TreinoPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plan = personalPlans.find((p) => p.id === id);
  if (!plan) return notFound();

  const isActivePlan = id === activePlan.id;
  const sessions = isActivePlan ? activePlan.sessions : [];
  const aluno = alunosSummary.find((s) => s.user.name === plan.aluno);

  return (
    <div className="max-w-4xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/treinos">
          <IconButton aria-label="Voltar">
            <ChevronLeft size={20} />
          </IconButton>
        </Link>
        <div className="flex-1 min-w-0">
          <Badge>{plan.weeklyFrequency}x semana</Badge>
          <h1 className="mt-1 text-h1 text-text-primary truncate">
            {plan.name}
          </h1>
          {isActivePlan && (
            <p className="text-caption text-text-muted">
              {formatLongDate(activePlan.startDate)} –{" "}
              {formatLongDate(activePlan.endDate)}
            </p>
          )}
        </div>
        <Button variant="secondary" size="sm">
          <Pencil size={14} aria-hidden /> Editar
        </Button>
      </header>

      {aluno && (
        <Card variant="default" className="mb-6 flex items-center gap-3">
          <Avatar src={aluno.user.avatar} name={aluno.user.name} size={40} />
          <div className="flex-1 min-w-0">
            <p className="text-body-lg text-text-primary font-semibold truncate">
              {aluno.user.name}
            </p>
            <p className="text-caption text-text-muted truncate">
              Aderência {aluno.aderencia}% · {aluno.treinosSemana.feitos}/
              {aluno.treinosSemana.prescritos} esta semana
            </p>
          </div>
          <Link
            href={`/alunos/${aluno.user.id}`}
            className="text-caption text-accent hover:underline"
          >
            Ver aluno →
          </Link>
        </Card>
      )}

      {sessions.length > 0 ? (
        <div className="flex flex-col gap-4">
          {sessions.map((s) => (
            <Card key={s.id} variant="default">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <Badge>Treino {s.letter}</Badge>
                  <h2 className="mt-1 text-h2 text-text-primary">{s.name}</h2>
                  <p className="text-caption text-text-muted">
                    {s.exercises.length} exercícios · ~{s.estimatedMinutes} min
                    · {s.dayOfWeek}
                  </p>
                </div>
              </div>
              <ul className="flex flex-col gap-2">
                {s.exercises.map((p, i) => {
                  const meta = exercisesById.get(p.exerciseId);
                  return (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 py-2 border-t border-border-subtle/60 first:border-t-0"
                    >
                      <span className="text-caption text-text-muted tnum w-6 shrink-0">
                        {i + 1}.
                      </span>
                      <span className="flex-1 text-body text-text-primary truncate">
                        {meta?.name}
                      </span>
                      <span className="text-caption text-text-secondary tnum shrink-0">
                        {p.sets}×{p.reps} ·{" "}
                        {p.weightKgSuggested > 0
                          ? formatKg(p.weightKgSuggested)
                          : "PC"}{" "}
                        · {formatDuration(p.restSeconds)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      ) : (
        <Card variant="default">
          <p className="text-body text-text-secondary">
            Detalhes deste plano ainda não disponíveis no mock.
          </p>
        </Card>
      )}
    </div>
  );
}
