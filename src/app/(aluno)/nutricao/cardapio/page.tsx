import Link from "next/link";
import { Utensils } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth-helpers";
import { getMyMealPlanHistory } from "@/lib/actions/nutri-meal-logs";

export default async function NutricaoCardapioPage() {
  await requireRole("ALUNO");
  const plans = await getMyMealPlanHistory();

  const activePlans = plans.filter((p) => p.isActive && !p.pausedAt);
  const otherPlans = plans.filter((p) => !p.isActive || p.pausedAt);

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Cardápios" subtitle="Seus planos alimentares" />

      {plans.length === 0 ? (
        <Card variant="default">
          <EmptyState
            icon={Utensils}
            title="Nenhum cardápio ainda"
            description="Quando sua nutricionista prescrever um cardápio, ele vai aparecer aqui."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {activePlans.length > 0 && (
            <Section title="Ativos">
              {activePlans.map((p) => (
                <PlanCard key={p.id} plan={p} />
              ))}
            </Section>
          )}
          {otherPlans.length > 0 && (
            <Section title="Histórico">
              {otherPlans.map((p) => (
                <PlanCard key={p.id} plan={p} />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-h2 text-text-primary mb-2">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function PlanCard({
  plan,
}: {
  plan: Awaited<ReturnType<typeof getMyMealPlanHistory>>[number];
}) {
  return (
    <Link href={`/nutricao/cardapio/${plan.id}`}>
      <Card variant="interactive" className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          {plan.nutritionist && (
            <Avatar
              src={plan.nutritionist.avatarUrl ?? undefined}
              name={plan.nutritionist.name}
              size={36}
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-body-lg font-semibold text-text-primary truncate">
              {plan.name}
            </p>
            {plan.nutritionist && (
              <p className="text-caption text-text-muted truncate">
                {plan.nutritionist.name}
              </p>
            )}
          </div>
          {plan.pausedAt ? (
            <Badge variant="warning">pausado</Badge>
          ) : plan.isActive ? (
            <Badge variant="concluido">ativo</Badge>
          ) : (
            <Badge variant="pulado">inativo</Badge>
          )}
        </div>
        <p className="text-caption text-text-secondary">
          {plan.meals.length} refeições
          {plan.targetCalories ? ` · ${plan.targetCalories} kcal/dia` : ""}
        </p>
      </Card>
    </Link>
  );
}
