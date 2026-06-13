"use client";

import * as React from "react";
import { Check, Droplet, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { logHydration, logMeal } from "@/lib/actions/nutri-meal-logs";
import type { MealLogStatus } from "@prisma/client";

interface MealItemData {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

interface MealData {
  id: string;
  name: string;
  timeOfDay: string | null;
  items: MealItemData[];
}

interface PlanData {
  id: string;
  name: string;
  targetCalories: number | null;
  meals: MealData[];
}

export function NutricaoHojeClient({
  plan,
  logs,
  hydrationMl,
}: {
  plan: PlanData;
  logs: Record<string, MealLogStatus>;
  hydrationMl: number;
}) {
  const [pendingMeal, setPendingMeal] = React.useState<string | null>(null);
  const [hydratingMl, setHydratingMl] = React.useState<number | null>(null);
  const [localLogs, setLocalLogs] = React.useState(logs);
  const [localHydration, setLocalHydration] = React.useState(hydrationMl);

  async function handleLog(mealId: string, status: MealLogStatus) {
    setPendingMeal(mealId);
    try {
      await logMeal(mealId, status);
      setLocalLogs({ ...localLogs, [mealId]: status });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    } finally {
      setPendingMeal(null);
    }
  }

  async function handleHydration(ml: number) {
    setHydratingMl(ml);
    try {
      await logHydration(ml);
      setLocalHydration((prev) => prev + ml);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    } finally {
      setHydratingMl(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {plan.meals.map((meal) => {
        const totals = computeTotals(meal.items);
        const status = localLogs[meal.id];
        const busy = pendingMeal === meal.id;
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
              <div className="flex items-center gap-2">
                {status === "LOGGED" && (
                  <Badge variant="concluido">registrado</Badge>
                )}
                {status === "SKIPPED" && <Badge variant="pulado">pulado</Badge>}
                <p className="text-caption text-text-muted tnum">
                  {Math.round(totals.kcal)} kcal · {Math.round(totals.protein)}g ptn
                </p>
              </div>
            </div>

            <ul className="flex flex-col gap-1">
              {meal.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-baseline justify-between gap-2 text-body text-text-secondary"
                >
                  <span className="truncate">
                    <span className="text-text-primary">{item.name}</span>{" · "}
                    {item.quantity}
                    {item.unit}
                  </span>
                  <span className="text-caption text-text-muted tnum shrink-0">
                    {Math.round((item.kcalPer100g * item.quantity) / 100)} kcal
                  </span>
                </li>
              ))}
            </ul>

            {!status && (
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleLog(meal.id, "LOGGED")}
                  disabled={busy}
                  fullWidth
                >
                  <Check size={14} aria-hidden /> Registrar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleLog(meal.id, "SKIPPED")}
                  disabled={busy}
                >
                  <X size={14} aria-hidden /> Pular
                </Button>
              </div>
            )}
            {status && (
              <button
                type="button"
                onClick={() => handleLog(meal.id, status === "LOGGED" ? "PENDING" : "LOGGED")}
                disabled={busy}
                className="self-end text-caption text-text-secondary hover:text-text-primary underline"
              >
                Desfazer
              </button>
            )}
          </Card>
        );
      })}

      <Card variant="default" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-h3 text-text-primary flex items-center gap-2">
            <Droplet size={18} className="text-accent" aria-hidden /> Hidratação
          </h3>
          <p className="text-body-lg font-semibold text-text-primary tnum">
            {(localHydration / 1000).toFixed(1)} L
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[200, 250, 500].map((ml) => (
            <Button
              key={ml}
              variant="secondary"
              size="sm"
              onClick={() => handleHydration(ml)}
              disabled={hydratingMl !== null}
            >
              + {ml} ml
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function computeTotals(items: MealItemData[]) {
  return items.reduce(
    (acc, item) => {
      const q = item.quantity / 100;
      return {
        kcal: acc.kcal + item.kcalPer100g * q,
        protein: acc.protein + item.proteinPer100g * q,
        carbs: acc.carbs + item.carbsPer100g * q,
        fat: acc.fat + item.fatPer100g * q,
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
