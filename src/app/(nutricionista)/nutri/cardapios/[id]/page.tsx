import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { requireNutricionista } from "@/lib/auth-helpers";
import { getMealPlan } from "@/lib/actions/nutri-meal-plans";

export default async function NutriCardapioViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireNutricionista();
  const { id } = await params;

  let plan: Awaited<ReturnType<typeof getMealPlan>>;
  try {
    plan = await getMealPlan(id);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="flex items-center gap-3 mb-4">
        <Link href="/nutri/cardapios">
          <IconButton aria-label="Voltar">
            <ChevronLeft size={20} />
          </IconButton>
        </Link>
      </header>

      <PageHeader
        title={plan.name}
        subtitle={
          plan.description ??
          `Início: ${plan.startDate.toISOString().slice(0, 10)}`
        }
      />

      <Card variant="default" className="flex items-center gap-3 mb-6">
        <Avatar
          src={plan.student.avatarUrl ?? undefined}
          name={plan.student.name}
          size={40}
        />
        <div className="min-w-0 flex-1">
          <p className="text-body-lg font-semibold text-text-primary truncate">
            {plan.student.name}
          </p>
          <p className="text-caption text-text-muted">Aluno</p>
        </div>
        {plan.pausedAt ? (
          <Badge variant="warning">pausado</Badge>
        ) : plan.isActive ? (
          <Badge variant="concluido">ativo</Badge>
        ) : (
          <Badge variant="pulado">inativo</Badge>
        )}
      </Card>

      {(plan.targetCalories ||
        plan.targetProteinG ||
        plan.targetCarbsG ||
        plan.targetFatG) && (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <TargetCell label="kcal" value={plan.targetCalories} />
          <TargetCell label="ptn" value={plan.targetProteinG} unit="g" />
          <TargetCell label="carb" value={plan.targetCarbsG} unit="g" />
          <TargetCell label="gord" value={plan.targetFatG} unit="g" />
        </section>
      )}

      <section className="flex flex-col gap-3">
        {plan.meals.map((meal) => {
          const totals = computeMealMacros(meal.items);
          return (
            <Card key={meal.id} variant="default" className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-h3 text-text-primary truncate">
                    {meal.name}
                  </h3>
                  {meal.timeOfDay && (
                    <p className="text-caption text-text-muted">
                      {meal.timeOfDay}
                    </p>
                  )}
                </div>
                <p className="text-caption text-text-muted tnum">
                  {Math.round(totals.kcal)} kcal · {Math.round(totals.protein)}g ptn
                </p>
              </div>
              <ul className="flex flex-col gap-2">
                {meal.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-baseline justify-between gap-2 text-body text-text-secondary"
                  >
                    <span className="truncate">
                      <span className="text-text-primary">
                        {item.food.name}
                      </span>{" "}
                      - {item.quantity}
                      {item.unit}
                    </span>
                    <span className="text-caption text-text-muted tnum shrink-0">
                      {Math.round(
                        (item.food.kcalPer100g * Number(item.quantity)) / 100,
                      )}{" "}
                      kcal
                    </span>
                  </li>
                ))}
              </ul>
              {meal.notes && (
                <p className="text-caption text-text-muted">{meal.notes}</p>
              )}
            </Card>
          );
        })}
      </section>
    </div>
  );
}

function TargetCell({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null;
  unit?: string;
}) {
  return (
    <Card variant="default" className="flex flex-col p-3">
      <span className="text-caption text-text-muted uppercase tracking-tight">
        {label}/dia
      </span>
      <span className="text-h2 text-text-primary tnum">
        {value ?? "·"}
        {value !== null && unit ? unit : ""}
      </span>
    </Card>
  );
}

function computeMealMacros(
  items: Array<{
    quantity: number | string;
    food: {
      kcalPer100g: number;
      proteinPer100g: number;
      carbsPer100g: number;
      fatPer100g: number;
    };
  }>,
) {
  return items.reduce(
    (acc, item) => {
      const q = Number(item.quantity) / 100;
      return {
        kcal: acc.kcal + item.food.kcalPer100g * q,
        protein: acc.protein + item.food.proteinPer100g * q,
        carbs: acc.carbs + item.food.carbsPer100g * q,
        fat: acc.fat + item.food.fatPer100g * q,
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
