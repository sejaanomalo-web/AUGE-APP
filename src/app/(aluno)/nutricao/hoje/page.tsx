import { Utensils } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth-helpers";
import {
  getMyActiveMealPlans,
  getTodayHydration,
  getTodayMealLogs,
} from "@/lib/actions/nutri-meal-logs";
import { NutricaoHojeClient } from "@/components/aluno/NutricaoHojeClient";

export default async function NutricaoHojePage() {
  await requireRole("ALUNO");
  const [plans, logs, hydration] = await Promise.all([
    getMyActiveMealPlans(),
    getTodayMealLogs(),
    getTodayHydration(),
  ]);

  // For now, surface the first active plan. Multi-plan rendering can come later.
  const plan = plans[0] ?? null;

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Hoje"
        subtitle={
          plan
            ? plan.name + (plan.nutritionist ? ` · ${plan.nutritionist.name}` : "")
            : "Nutrição"
        }
      />

      {!plan ? (
        <Card variant="default">
          <EmptyState
            icon={Utensils}
            title="Seu cardápio está a caminho"
            description="Assim que sua nutricionista prescrever um cardápio, as refeições do dia aparecem aqui, com horários, porções e o registro de cada uma."
          />
        </Card>
      ) : (
        <NutricaoHojeClient
          plan={{
            id: plan.id,
            name: plan.name,
            targetCalories: plan.targetCalories,
            meals: plan.meals.map((m) => ({
              id: m.id,
              name: m.name,
              timeOfDay: m.timeOfDay,
              items: m.items.map((i) => ({
                id: i.id,
                name: i.food.name,
                quantity: Number(i.quantity),
                unit: i.unit,
                kcalPer100g: i.food.kcalPer100g,
                proteinPer100g: i.food.proteinPer100g,
                carbsPer100g: i.food.carbsPer100g,
                fatPer100g: i.food.fatPer100g,
              })),
            })),
          }}
          logs={Object.fromEntries(
            Object.entries(logs).map(([mealId, l]) => [mealId, l.status]),
          )}
          hydrationMl={hydration.totalMl}
        />
      )}
    </div>
  );
}
