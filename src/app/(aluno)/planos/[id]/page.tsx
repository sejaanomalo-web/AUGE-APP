import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { LinkButton } from "@/components/ui/LinkButton";
import { requireRole } from "@/lib/auth-helpers";
import { getPlanById } from "@/lib/actions/workout-plans";
import {
  getPlanMetrics,
  getPlanMetricLogs,
} from "@/lib/actions/plan-metrics";
import { PlanMetricsSection } from "@/components/aluno/PlanMetricsSection";
import { formatLongDate } from "@/lib/date";
import { formatDuration, formatKg } from "@/lib/utils";

const DAY_NAMES = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export default async function PlanoDetailAlunoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireRole("ALUNO");
  const { id } = await params;
  const plan = await getPlanById(id);
  if (!plan || plan.studentId !== me.id) return notFound();

  const isSelfCreated = plan.trainerId === null;
  const [metrics, metricLogs] = await Promise.all([
    getPlanMetrics(id),
    getPlanMetricLogs(id),
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/planos">
          <IconButton aria-label="Voltar">
            <ChevronLeft size={20} />
          </IconButton>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {plan.isActive && <Badge variant="concluido">Ativo</Badge>}
            {isSelfCreated && <Badge variant="info">Criado por você</Badge>}
          </div>
          <h1 className="text-h1 text-text-primary truncate">{plan.name}</h1>
          <p className="text-caption text-text-muted">
            {formatLongDate(plan.startDate.toISOString())}
            {plan.endDate
              ? ` - ${formatLongDate(plan.endDate.toISOString())}`
              : ""}
          </p>
        </div>
      </header>

      {plan.description && (
        <Card variant="default" className="mb-4">
          <p className="text-body text-text-secondary whitespace-pre-line">
            {plan.description}
          </p>
        </Card>
      )}

      {plan.sessions.length === 0 ? (
        <Card variant="default">
          <p className="text-body text-text-secondary">
            Sem treinos definidos neste plano ainda.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {plan.sessions.map((s) => (
            <Card key={s.id} variant="default">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <Badge>
                    {s.dayOfWeek != null ? DAY_NAMES[s.dayOfWeek] : "Livre"}
                  </Badge>
                  <h2 className="mt-1 text-h2 text-text-primary truncate">
                    {s.name}
                  </h2>
                  <p className="text-caption text-text-muted">
                    {s.exercises.length}{" "}
                    {s.exercises.length === 1 ? "exercício" : "exercícios"}
                  </p>
                </div>
                <LinkButton
                  href={`/treino/${s.id}`}
                  variant="primary"
                  size="sm"
                >
                  Ver
                </LinkButton>
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
                      {p.restSeconds && p.restSeconds > 0 ? (
                        <span className="inline-flex items-center gap-0.5 ml-1">
                          <Clock size={11} aria-hidden />
                          {formatDuration(p.restSeconds)}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <PlanMetricsSection
        metrics={metrics.map((m) => ({
          id: m.id,
          name: m.name,
          unit: m.unit,
          requiresAttachment: m.requiresAttachment,
        }))}
        logs={metricLogs.map((l) => ({
          id: l.id,
          definitionId: l.definitionId,
          value: l.value,
          attachmentKey: l.attachmentKey,
          date: l.date.toISOString(),
        }))}
      />
    </div>
  );
}
