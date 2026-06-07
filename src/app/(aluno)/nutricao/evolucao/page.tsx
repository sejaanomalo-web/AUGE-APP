import { TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth-helpers";
import {
  getNutritionEvolution,
  getNutritionLoggedDates,
} from "@/lib/actions/nutri-meal-logs";
import { NutricaoEvolucaoClient } from "@/components/aluno/NutricaoEvolucaoClient";

const ALLOWED_RANGES = [7, 30, 90];

export default async function NutricaoEvolucaoPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireRole("ALUNO");
  const { range: rangeParam } = await searchParams;
  const requested = Number(rangeParam);
  const range = ALLOWED_RANGES.includes(requested) ? requested : 30;

  const [data, loggedDates] = await Promise.all([
    getNutritionEvolution(range),
    getNutritionLoggedDates(new Date().getFullYear()),
  ]);

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Evolução" subtitle="Acompanhamento nutricional" />

      {!data.hasData ? (
        <Card variant="default">
          <EmptyState
            icon={TrendingUp}
            title="Sem dados ainda"
            description="Registre suas refeições e a hidratação em “Hoje” para acompanhar aqui sua aderência, calorias e progresso ao longo do tempo."
          />
        </Card>
      ) : (
        <NutricaoEvolucaoClient data={data} loggedDates={loggedDates} />
      )}
    </div>
  );
}
