import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth-helpers";
import { getMealPlan } from "@/lib/actions/nutri-meal-plans";

export default async function NutricaoCardapioViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ALUNO");
  const { id } = await params;

  let plan: Awaited<ReturnType<typeof getMealPlan>>;
  try {
    plan = await getMealPlan(id);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <header className="flex items-center gap-3 mb-4">
        <Link href="/nutricao/cardapio">
          <IconButton aria-label="Voltar">
            <ChevronLeft size={20} />
          </IconButton>
        </Link>
      </header>
      <PageHeader
        title={plan.name}
        subtitle={
          plan.description ??
          `${plan.meals.length} refeições${
            plan.targetCalories ? ` · ${plan.targetCalories} kcal/dia` : ""
          }`
        }
      />

      <div className="flex flex-col gap-3">
        {plan.meals.map((meal) => (
          <Card key={meal.id} variant="default" className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-h3 text-text-primary truncate">{meal.name}</h3>
              {meal.timeOfDay && (
                <p className="text-caption text-text-muted">{meal.timeOfDay}</p>
              )}
            </div>
            <ul className="flex flex-col gap-1">
              {meal.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-baseline justify-between gap-2 text-body text-text-secondary"
                >
                  <span className="truncate">
                    <span className="text-text-primary">{item.food.name}</span>{" "}
                    — {item.quantity}
                    {item.unit}
                  </span>
                  <span className="text-caption text-text-muted tnum shrink-0">
                    {Math.round((item.food.kcalPer100g * Number(item.quantity)) / 100)} kcal
                  </span>
                </li>
              ))}
            </ul>
            {meal.notes && (
              <p className="text-caption text-text-muted">{meal.notes}</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
