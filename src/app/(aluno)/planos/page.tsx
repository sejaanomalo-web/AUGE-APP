import { ListChecks, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { TreinosByPeriod } from "@/components/aluno/TreinosByPeriod";
import { requireRole } from "@/lib/auth-helpers";
import { getMyPlans } from "@/lib/actions/workout-plans";
import { getMyTrainer } from "@/lib/actions/users";
import { projectSessionsInRange } from "@/lib/aluno-stats";

export default async function PlanosPage() {
  await requireRole("ALUNO");
  const [plans, trainer] = await Promise.all([
    getMyPlans(),
    getMyTrainer(),
  ]);

  const activePlan = plans.find((p) => p.isActive);
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
            ? `Treinos prescritos pelo seu personal ${trainer.name.split(" ")[0]}.`
            : "Acompanhe seus treinos pelo período."
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
              : "Crie seu primeiro plano de treino. Você define os exercícios, séries e descansos."
          }
          action={
            trainer ? undefined : (
              <LinkButton href="/planos/novo" variant="primary" size="md">
                <Plus size={16} aria-hidden /> Criar plano
              </LinkButton>
            )
          }
        />
      ) : projected.length > 0 ? (
        <TreinosByPeriod projected={projected} />
      ) : (
        <EmptyState
          icon={ListChecks}
          title="Plano sem cronograma"
          description="Este plano ainda não tem treinos atribuídos a dias da semana."
        />
      )}
    </div>
  );
}
