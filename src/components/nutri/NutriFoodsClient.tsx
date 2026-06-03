"use client";

import * as React from "react";
import { Plus, Search, Trash2, Wheat, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  createCustomFood,
  deleteCustomFood,
  searchFoods,
  type FoodOption,
} from "@/lib/actions/nutri-foods";

export function NutriFoodsClient({
  initialFoods,
}: {
  initialFoods: FoodOption[];
}) {
  const [q, setQ] = React.useState("");
  const [foods, setFoods] = React.useState<FoodOption[]>(initialFoods);
  const [searching, setSearching] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  // Debounced search: empty query restores the initial list.
  React.useEffect(() => {
    const term = q.trim();
    if (term.length === 0) {
      setFoods(initialFoods);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const rows = await searchFoods(term);
        if (!cancelled) setFoods(rows);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, initialFoods]);

  async function handleDelete(food: FoodOption) {
    if (!food.isCustom) return;
    if (!confirm(`Excluir "${food.name}"?`)) return;
    try {
      await deleteCustomFood(food.id);
      setFoods((prev) => prev.filter((f) => f.id !== food.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            aria-hidden
          />
          <Input
            placeholder="Buscar (ex: arroz, frango, banana)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
            aria-label="Buscar alimentos"
          />
          {q.length > 0 && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
            >
              <X size={16} aria-hidden />
            </button>
          )}
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={16} aria-hidden /> Novo alimento
        </Button>
      </div>

      {searching && (
        <p className="text-caption text-text-muted" role="status">
          Buscando...
        </p>
      )}

      {foods.length === 0 ? (
        <Card variant="default">
          <EmptyState
            icon={Wheat}
            title="Nenhum alimento encontrado"
            description={
              q.length > 0
                ? "Tenta uma busca mais curta ou cadastra um alimento custom."
                : "Cadastre seus primeiros alimentos pra começar a montar cardápios."
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {foods.map((f) => (
            <Card key={f.id} variant="default" className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-body-lg font-semibold text-text-primary truncate">
                    {f.name}
                  </p>
                  {f.brand && (
                    <p className="text-caption text-text-muted truncate">
                      {f.brand}
                    </p>
                  )}
                </div>
                <Badge variant={f.isCustom ? "info" : "concluido"}>
                  {f.source}
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-1 text-caption text-text-secondary">
                <Macro label="kcal" value={f.kcalPer100g} />
                <Macro label="ptn" value={f.proteinPer100g} unit="g" />
                <Macro label="ch" value={f.carbsPer100g} unit="g" />
                <Macro label="gord" value={f.fatPer100g} unit="g" />
              </div>
              {f.isCustom && (
                <button
                  type="button"
                  onClick={() => handleDelete(f)}
                  className="self-end inline-flex items-center gap-1 text-caption text-error hover:underline"
                  aria-label={`Excluir ${f.name}`}
                >
                  <Trash2 size={12} aria-hidden /> Excluir
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      <CreateFoodDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(food) => {
          setFoods((prev) => [food, ...prev]);
          setCreateOpen(false);
        }}
      />
    </div>
  );
}

function Macro({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-text-primary font-semibold tnum">
        {value}
        {unit}
      </span>
      <span className="text-text-muted uppercase tracking-tight">{label}</span>
    </div>
  );
}

function CreateFoodDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (food: FoodOption) => void;
}) {
  const [form, setForm] = React.useState({
    name: "",
    brand: "",
    kcal: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function field<K extends keyof typeof form>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [key]: e.target.value });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const kcal = parseFloat(form.kcal);
    const protein = parseFloat(form.protein);
    const carbs = parseFloat(form.carbs);
    const fat = parseFloat(form.fat);
    const fiber = form.fiber ? parseFloat(form.fiber) : undefined;

    if (!form.name.trim()) {
      setError("Nome obrigatório.");
      return;
    }
    if ([kcal, protein, carbs, fat].some(Number.isNaN)) {
      setError("Macros precisam ser números.");
      return;
    }

    setSubmitting(true);
    try {
      const food = await createCustomFood({
        name: form.name,
        brand: form.brand.trim() || undefined,
        kcalPer100g: kcal,
        proteinPer100g: protein,
        carbsPer100g: carbs,
        fatPer100g: fat,
        fiberPer100g: fiber,
      });
      onCreated(food);
      setForm({
        name: "",
        brand: "",
        kcal: "",
        protein: "",
        carbs: "",
        fat: "",
        fiber: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title="Novo alimento"
      description="Adicione um alimento ao seu catálogo pessoal. Os valores são por 100 g."
    >
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="Nome" htmlFor="food-name">
          <Input
            id="food-name"
            value={form.name}
            onChange={field("name")}
            autoFocus
          />
        </Field>
        <Field label="Marca (opcional)" htmlFor="food-brand">
          <Input
            id="food-brand"
            value={form.brand}
            onChange={field("brand")}
            placeholder="ex: Whey GoldStandard"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="kcal / 100 g" htmlFor="food-kcal">
            <Input
              id="food-kcal"
              type="number"
              step="0.1"
              value={form.kcal}
              onChange={field("kcal")}
              inputMode="decimal"
            />
          </Field>
          <Field label="Proteína (g)" htmlFor="food-prot">
            <Input
              id="food-prot"
              type="number"
              step="0.1"
              value={form.protein}
              onChange={field("protein")}
              inputMode="decimal"
            />
          </Field>
          <Field label="Carboidrato (g)" htmlFor="food-carbs">
            <Input
              id="food-carbs"
              type="number"
              step="0.1"
              value={form.carbs}
              onChange={field("carbs")}
              inputMode="decimal"
            />
          </Field>
          <Field label="Gordura (g)" htmlFor="food-fat">
            <Input
              id="food-fat"
              type="number"
              step="0.1"
              value={form.fat}
              onChange={field("fat")}
              inputMode="decimal"
            />
          </Field>
          <Field label="Fibra (g) (opcional)" htmlFor="food-fiber">
            <Input
              id="food-fiber"
              type="number"
              step="0.1"
              value={form.fiber}
              onChange={field("fiber")}
              inputMode="decimal"
            />
          </Field>
        </div>

        {error && (
          <p className="text-body text-error" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 mt-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={submitting}>
            {submitting ? "Salvando..." : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
