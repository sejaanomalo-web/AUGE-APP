import Link from "next/link";
import { ListChecks, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { HeroCard } from "@/components/visual/HeroCard";
import { TreinosByPeriod } from "@/components/aluno/TreinosByPeriod";
import { requireRole } from "@/lib/auth-helpers";
import { getMyPlans } from "@/lib/actions/workout-plans";
import { getMyTrainer } from "@/lib/actions/users";
import { formatLongDate, formatRelativeFromNow } from "@/lib/date";
import { projectSessionsInRange } from "@/lib/aluno-stats";
import { cn } from "@/lib/utils";

const DAY_NAMES = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export default async function PlanosPage() {
  await requireRole("ALUNO");
  const [plans, trainer] = await Promise.all([
    getMyPlans(),
    getMyTrainer(),
  ]);
  const nowIso = new Date().toISOString();

  const activePlan = plans.find((p) => p.isActive);
  const otherPlans = plans.filter((p) => !p.isActive);
  // Project a full year of the active plan's weekly schedule so the
  // <TreinosByPeriod /> client can filter without going back to the server.
  const projected = activePlan
    ? projectSessionsInRange(activePlan.sessions, new Date(), 365).map((u) => ({
        dateIso: u.date.toISOString(),
        sessionId: u.session.id,
        sessionName: u.session.name,
        exerciseCount: u.session.exercises.length,
      }))
    : [];

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Treinos"
        subtitle={
          trainer
            ? `Planos prescritos pelo seu personal ${trainer.name.split(" ")[0]}.`
            : "Crie seus treinos e acompanhe a execução."
        }
        actions={
          trainer ? undefined : (
            <LinkButton href="/planos/novo" variant="primary" size="md">
              <Plus size={18} aria-hidden /> Novo plano
            </LinkButton>
          )
        }
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Nenhum plano ainda"
          description={
            trainer
              ? "Aguarde seu personal montar um plano para você. Ele vai aparecer aqui assim que estiver pronto."
              : "Crie seu primeiro plano de treino — você define os exercícios, séries e descansos."
          }
          action={
            trainer ? undefined : (
              <LinkButton href="/planos/novo" variant="primary" size="md">
                <Plus size={16} aria-hidden /> Criar plano
              </LinkButton>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {projected.length > 0 && <TreinosByPeriod projected={projected} />}

          {activePlan && (
            <section>
              <h2 className="text-caption uppercase tracking-normal text-text-muted font-semibold mb-2">
                Ativo
              </h2>
              <PlanCard
                plan={activePlan}
                createdByTrainerName={trainer?.name}
                nowIso={nowIso}
                featured
              />
            </section>
          )}

          {otherPlans.length > 0 && (
            <section>
              <h2 className="text-caption uppercase tracking-normal text-text-muted font-semibold mb-2">
                Outros planos
              </h2>
              <div className="flex flex-col gap-2">
                {otherPlans.map((p) => (
                  <PlanCard
                    key={p.id}
                    plan={p}
                    createdByTrainerName={trainer?.name}
                    nowIso={nowIso}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  createdByTrainerName,
  nowIso,
  featured = false,
}: {
  plan: {
    id: string;
    name: string;
    description: string | null;
    startDate: Date;
    endDate: Date | null;
    isActive: boolean;
    trainerId: string | null;
    createdAt: Date;
    sessions: { id: string; name: string; dayOfWeek: number | null }[];
  };
  createdByTrainerName?: string;
  nowIso: string;
  /** Active plan gets the strongest Pulse Line treatment. */
  featured?: boolean;
}) {
  const sessionsByDay = new Map<number, typeof plan.sessions>();
  for (const s of plan.sessions) {
    if (s.dayOfWeek == null) continue;
    sessionsByDay.set(s.dayOfWeek, [
      ...(sessionsByDay.get(s.dayOfWeek) ?? []),
      s,
    ]);
  }

  return (
    <Link href={`/planos/${plan.id}`} className="block">
      <HeroCard
        intensity={featured ? "strong" : "medium"}
        className={cn(
          "p-5 transition duration-150 cursor-pointer",
          "hover:-translate-y-px hover:border-border",
          featured && "ring-1 ring-accent/30 shadow-accent",
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <p className="text-stat-label uppercase text-text-muted mb-2">
              {plan.trainerId
                ? `Criado por ${createdByTrainerName ?? "seu personal"}`
                : `Criado por você · ${formatRelativeFromNow(plan.createdAt.toISOString(), nowIso)}`}
            </p>
            <h3 className="text-h2 text-text-primary">{plan.name}</h3>
            {plan.description && (
              <p className="mt-1 text-body text-text-secondary line-clamp-2">
                {plan.description}
              </p>
            )}
          </div>
          {plan.isActive && <Badge variant="concluido">Ativo</Badge>}
        </div>

        <p className="text-caption text-text-muted tnum">
          {formatLongDate(plan.startDate.toISOString())}
          {plan.endDate
            ? ` – ${formatLongDate(plan.endDate.toISOString())}`
            : " — em andamento"}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {plan.sessions.length === 0 ? (
            <span className="text-caption text-text-muted italic">
              Sem treinos ainda
            </span>
          ) : (
            plan.sessions.slice(0, 7).map((s) => (
              <Badge key={s.id}>
                {s.dayOfWeek != null
                  ? `${DAY_NAMES[s.dayOfWeek].slice(0, 3)} · ${s.name}`
                  : s.name}
              </Badge>
            ))
          )}
        </div>
      </HeroCard>
    </Link>
  );
}
