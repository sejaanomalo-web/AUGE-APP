import Link from "next/link";
import { ListChecks, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/LinkButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { requireRole } from "@/lib/auth-helpers";
import { getMyPlans } from "@/lib/actions/workout-plans";
import { getMyTrainer } from "@/lib/actions/users";
import { capitalize, formatDayMonth, formatLongDate, formatRelativeFromNow } from "@/lib/date";
import { nextUpcomingSessions } from "@/lib/aluno-stats";

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
  const upcoming = activePlan
    ? nextUpcomingSessions(activePlan.sessions, new Date(), 5)
    : [];

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Meus planos"
        subtitle={
          trainer
            ? `Planos prescritos pelo seu personal ${trainer.name.split(" ")[0]}.`
            : "Seus planos de treino. Crie um pra começar."
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
          {/* Próximos treinos — moved here from /hoje. Sits above the
           * active plan so the student lands on actionable cards first. */}
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-caption uppercase tracking-[0.06em] text-text-muted font-semibold mb-2">
                Próximos treinos
              </h2>
              <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory">
                {upcoming.map((u, i) => {
                  const isNext = i === 0;
                  return (
                    <Link
                      key={`${u.session.id}-${i}`}
                      href={`/treino/${u.session.id}`}
                      className="snap-start shrink-0 w-[220px]"
                    >
                      <Card
                        variant="interactive"
                        className={
                          isNext
                            ? "h-32 flex flex-col justify-between !border-accent/60 ring-1 ring-accent/30 shadow-accent"
                            : "h-32 flex flex-col justify-between"
                        }
                      >
                        <div>
                          <p
                            className={`text-stat-label uppercase ${
                              isNext ? "text-accent" : "text-text-muted"
                            }`}
                          >
                            {isNext
                              ? "Próximo"
                              : capitalize(
                                  formatDayMonth(
                                    u.date.toISOString().slice(0, 10),
                                  ).split(",")[0],
                                )}
                          </p>
                          <p className="mt-2 text-h3 text-text-primary line-clamp-2">
                            {u.session.name}
                          </p>
                        </div>
                        <p className="text-caption text-text-muted">
                          {u.session.exercises.length} exercícios
                        </p>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {activePlan && (
            <section>
              <h2 className="text-caption uppercase tracking-[0.06em] text-text-muted font-semibold mb-2">
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
              <h2 className="text-caption uppercase tracking-[0.06em] text-text-muted font-semibold mb-2">
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
  /** Active/hero plan — gets a gold ring to read as the headline. */
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
      <Card
        variant="interactive"
        className={
          featured
            ? "!border-accent/60 ring-1 ring-accent/30 shadow-accent"
            : undefined
        }
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <p className="text-caption text-text-muted mb-1">
              {plan.trainerId
                ? `Criado por ${createdByTrainerName ?? "seu personal"}`
                : `Criado por você · ${formatRelativeFromNow(plan.createdAt.toISOString(), nowIso)}`}
            </p>
            <h3 className="text-h3 text-text-primary">{plan.name}</h3>
            {plan.description && (
              <p className="mt-0.5 text-caption text-text-muted line-clamp-2">
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
      </Card>
    </Link>
  );
}
