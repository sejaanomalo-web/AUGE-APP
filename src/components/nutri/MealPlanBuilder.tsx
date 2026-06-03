"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  createMealPlan,
  type CreateMealPlanInput,
} from "@/lib/actions/nutri-meal-plans";
import type { FoodOption } from "@/lib/actions/nutri-foods";
import { FoodSelector } from "./FoodSelector";

interface Aluno {
  id: string;
  name: string;
}

interface DraftItem {
  tempId: string;
  food: FoodOption;
  quantity: string;
  unit: string;
}

interface DraftMeal {
  tempId: string;
  name: string;
  timeOfDay: string;
  notes: string;
  items: DraftItem[];
}

const emptyMeal = (name: string, timeOfDay = ""): DraftMeal => ({
  tempId: cryptoLikeId(),
  name,
  timeOfDay,
  notes: "",
  items: [],
});

function cryptoLikeId() {
  // Pseudo-random — only used as React key; not security-sensitive.
  return Math.random().toString(36).slice(2, 10);
}

export function MealPlanBuilder({
  alunos,
  foods,
}: {
  alunos: Aluno[];
  foods: FoodOption[];
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [studentId, setStudentId] = React.useState(alunos[0]?.id ?? "");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [startDate, setStartDate] = React.useState(today);
  const [endDate, setEndDate] = React.useState("");
  const [tCal, setTCal] = React.useState("");
  const [tPro, setTPro] = React.useState("");
  const [tCar, setTCar] = React.useState("");
  const [tFat, setTFat] = React.useState("");

  const [meals, setMeals] = React.useState<DraftMeal[]>([
    emptyMeal("Café da manhã", "07:30"),
    emptyMeal("Almoço", "12:30"),
    emptyMeal("Jantar", "19:30"),
  ]);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [selectorMealId, setSelectorMealId] = React.useState<string | null>(
    null,
  );

  function updateMeal(tempId: string, patch: Partial<DraftMeal>) {
    setMeals((prev) =>
      prev.map((m) => (m.tempId === tempId ? { ...m, ...patch } : m)),
    );
  }

  function removeMeal(tempId: string) {
    setMeals((prev) => prev.filter((m) => m.tempId !== tempId));
  }

  function addMeal() {
    setMeals((prev) => [...prev, emptyMeal("Refeição", "")]);
  }

  function addItemToMeal(mealId: string, food: FoodOption) {
    setMeals((prev) =>
      prev.map((m) =>
        m.tempId === mealId
          ? {
              ...m,
              items: [
                ...m.items,
                { tempId: cryptoLikeId(), food, quantity: "100", unit: "g" },
              ],
            }
          : m,
      ),
    );
  }

  function updateItem(
    mealId: string,
    itemId: string,
    patch: Partial<DraftItem>,
  ) {
    setMeals((prev) =>
      prev.map((m) =>
        m.tempId === mealId
          ? {
              ...m,
              items: m.items.map((i) =>
                i.tempId === itemId ? { ...i, ...patch } : i,
              ),
            }
          : m,
      ),
    );
  }

  function removeItem(mealId: string, itemId: string) {
    setMeals((prev) =>
      prev.map((m) =>
        m.tempId === mealId
          ? { ...m, items: m.items.filter((i) => i.tempId !== itemId) }
          : m,
      ),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!studentId) return setError("Selecione um aluno.");
    if (!name.trim()) return setError("Dê um nome ao cardápio.");
    if (meals.length === 0)
      return setError("Adicione ao menos uma refeição.");
    for (const m of meals) {
      if (!m.name.trim()) return setError("Toda refeição precisa de um nome.");
      if (m.items.length === 0)
        return setError(
          `A refeição "${m.name}" precisa ter ao menos um alimento.`,
        );
      for (const i of m.items) {
        const q = parseFloat(i.quantity);
        if (Number.isNaN(q) || q <= 0)
          return setError(
            `Quantidade inválida em "${i.food.name}" (refeição "${m.name}").`,
          );
      }
    }

    const payload: CreateMealPlanInput = {
      studentId,
      name: name.trim(),
      description: description.trim() || undefined,
      startDate,
      endDate: endDate || undefined,
      targetCalories: tCal ? parseInt(tCal, 10) : undefined,
      targetProteinG: tPro ? parseInt(tPro, 10) : undefined,
      targetCarbsG: tCar ? parseInt(tCar, 10) : undefined,
      targetFatG: tFat ? parseInt(tFat, 10) : undefined,
      meals: meals.map((m) => ({
        name: m.name.trim(),
        timeOfDay: m.timeOfDay.trim() || undefined,
        notes: m.notes.trim() || undefined,
        items: m.items.map((i) => ({
          foodId: i.food.id,
          quantity: parseFloat(i.quantity),
          unit: i.unit,
          notes: undefined,
        })),
      })),
    };

    setSubmitting(true);
    try {
      const { id } = await createMealPlan(payload);
      router.push(`/nutri/cardapios/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
      setSubmitting(false);
    }
  }

  const dailyTotals = computeDailyTotals(meals);

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <Card variant="default" className="flex flex-col gap-3">
        <Field label="Aluno" htmlFor="cardapio-aluno">
          <Select
            id="cardapio-aluno"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            {alunos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nome do cardápio" htmlFor="cardapio-nome">
          <Input
            id="cardapio-nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex: Hipertrofia — 2200 kcal"
            autoFocus
          />
        </Field>
        <Field label="Descrição (opcional)" htmlFor="cardapio-desc">
          <Textarea
            id="cardapio-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Observações ou objetivo do plano"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Início" htmlFor="cardapio-start">
            <Input
              id="cardapio-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Field>
          <Field label="Fim (opcional)" htmlFor="cardapio-end">
            <Input
              id="cardapio-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card variant="default" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-h3 text-text-primary">Metas diárias</h3>
          <p className="text-caption text-text-muted">opcionais</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="kcal" htmlFor="t-kcal">
            <Input
              id="t-kcal"
              type="number"
              inputMode="decimal"
              value={tCal}
              onChange={(e) => setTCal(e.target.value)}
            />
          </Field>
          <Field label="Proteína (g)" htmlFor="t-prot">
            <Input
              id="t-prot"
              type="number"
              inputMode="decimal"
              value={tPro}
              onChange={(e) => setTPro(e.target.value)}
            />
          </Field>
          <Field label="Carboidrato (g)" htmlFor="t-carb">
            <Input
              id="t-carb"
              type="number"
              inputMode="decimal"
              value={tCar}
              onChange={(e) => setTCar(e.target.value)}
            />
          </Field>
          <Field label="Gordura (g)" htmlFor="t-fat">
            <Input
              id="t-fat"
              type="number"
              inputMode="decimal"
              value={tFat}
              onChange={(e) => setTFat(e.target.value)}
            />
          </Field>
        </div>
        <p className="text-caption text-text-muted">
          Total no cardápio:{" "}
          <span className="tnum text-text-primary">
            {Math.round(dailyTotals.kcal)} kcal · {Math.round(dailyTotals.protein)}g
            ptn · {Math.round(dailyTotals.carbs)}g ch · {Math.round(dailyTotals.fat)}g
            gord
          </span>
        </p>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-h3 text-text-primary">Refeições</h3>
          <Button type="button" variant="secondary" size="sm" onClick={addMeal}>
            <Plus size={14} aria-hidden /> Refeição
          </Button>
        </div>

        {meals.map((meal) => {
          const totals = computeMealTotals(meal);
          return (
            <Card
              key={meal.tempId}
              variant="default"
              className="flex flex-col gap-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-2 items-end">
                <Field label="Nome" htmlFor={`m-name-${meal.tempId}`}>
                  <Input
                    id={`m-name-${meal.tempId}`}
                    value={meal.name}
                    onChange={(e) =>
                      updateMeal(meal.tempId, { name: e.target.value })
                    }
                  />
                </Field>
                <Field label="Horário" htmlFor={`m-time-${meal.tempId}`}>
                  <Input
                    id={`m-time-${meal.tempId}`}
                    value={meal.timeOfDay}
                    onChange={(e) =>
                      updateMeal(meal.tempId, { timeOfDay: e.target.value })
                    }
                    placeholder="ex: 07:30"
                  />
                </Field>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeMeal(meal.tempId)}
                  aria-label="Remover refeição"
                >
                  <Trash2 size={14} aria-hidden />
                </Button>
              </div>

              {meal.items.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {meal.items.map((item) => {
                    const q = parseFloat(item.quantity) || 0;
                    const kcal = (item.food.kcalPer100g * q) / 100;
                    return (
                      <li
                        key={item.tempId}
                        className="flex items-center gap-2 bg-bg-elevated rounded-md p-2"
                      >
                        <span className="flex-1 min-w-0 text-body text-text-primary truncate">
                          {item.food.name}
                        </span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(meal.tempId, item.tempId, {
                              quantity: e.target.value,
                            })
                          }
                          className="w-20 text-center"
                          aria-label="Quantidade"
                        />
                        <span className="text-caption text-text-muted">
                          {item.unit}
                        </span>
                        <span className="text-caption text-text-muted tnum shrink-0 w-16 text-right">
                          {Math.round(kcal)} kcal
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(meal.tempId, item.tempId)}
                          className="text-text-secondary hover:text-error"
                          aria-label="Remover item"
                        >
                          <X size={14} aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelectorMealId(meal.tempId)}
              >
                <Plus size={14} aria-hidden /> Adicionar alimento
              </Button>

              <Textarea
                value={meal.notes}
                onChange={(e) =>
                  updateMeal(meal.tempId, { notes: e.target.value })
                }
                placeholder="Observações (opcional)"
                rows={2}
                aria-label={`Observações da refeição ${meal.name}`}
              />

              <p className="text-caption text-text-muted tnum">
                Total: {Math.round(totals.kcal)} kcal ·{" "}
                {Math.round(totals.protein)}g ptn ·{" "}
                {Math.round(totals.carbs)}g ch · {Math.round(totals.fat)}g gord
              </p>
            </Card>
          );
        })}

        {meals.length === 0 && (
          <Card variant="default">
            <p className="text-body text-text-muted text-center py-4">
              Nenhuma refeição adicionada ainda.
            </p>
          </Card>
        )}
      </section>

      {error && (
        <p className="text-body text-error" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 sticky bottom-4 bg-bg-base/80 backdrop-blur-md py-3 rounded-xl">
        <Button
          type="button"
          variant="secondary"
          size="cta"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button type="submit" variant="primary" size="cta" disabled={submitting}>
          {submitting ? "Salvando..." : "Salvar cardápio"}
        </Button>
      </div>

      <FoodSelector
        open={selectorMealId !== null}
        foods={foods}
        onClose={() => setSelectorMealId(null)}
        onPick={(food) => {
          if (selectorMealId) addItemToMeal(selectorMealId, food);
          setSelectorMealId(null);
        }}
      />
    </form>
  );
}

function computeMealTotals(meal: DraftMeal) {
  return meal.items.reduce(
    (acc, item) => {
      const q = (parseFloat(item.quantity) || 0) / 100;
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

function computeDailyTotals(meals: DraftMeal[]) {
  return meals.reduce(
    (acc, m) => {
      const t = computeMealTotals(m);
      return {
        kcal: acc.kcal + t.kcal,
        protein: acc.protein + t.protein,
        carbs: acc.carbs + t.carbs,
        fat: acc.fat + t.fat,
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
