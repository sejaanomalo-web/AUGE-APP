"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Field, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { createCustomExercise } from "@/lib/actions/exercises";

export interface ExerciseRow {
  id: string;
  name: string;
  muscleGroup: string;
  isCustom: boolean;
}

const MUSCLE_GROUPS = [
  "Peito",
  "Costas",
  "Pernas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Abdômen",
  "Cardio",
];

export function ExerciciosClient({ exercises }: { exercises: ExerciseRow[] }) {
  const [q, setQ] = React.useState("");
  const [active, setActive] = React.useState<string>("Todos");
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const filtered = exercises.filter((e) => {
    const matchQ = q === "" || e.name.toLowerCase().includes(q.toLowerCase());
    const matchG = active === "Todos" || e.muscleGroup === active;
    return matchQ && matchG;
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      await createCustomExercise({
        name: String(form.get("name") || "").trim(),
        muscleGroup: String(form.get("muscleGroup") || ""),
        instructions: String(form.get("instructions") || "").trim() || undefined,
      });
      setOpen(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-end mb-3">
        <Button variant="primary" size="md" onClick={() => setOpen(true)}>
          <Plus size={18} aria-hidden /> Adicionar exercício
        </Button>
      </div>

      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          aria-hidden
        />
        <Input
          placeholder="Buscar exercício..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-10 rounded-pill"
        />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none -mx-1 px-1">
        {(["Todos", ...MUSCLE_GROUPS] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setActive(g)}
            className={cn(
              "shrink-0 px-3 py-2 rounded-pill text-body font-semibold transition-colors",
              active === g
                ? "bg-accent text-text-on-accent"
                : "bg-bg-elevated text-text-secondary hover:text-text-primary",
            )}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((e) => (
          <Card key={e.id} variant="interactive">
            <div
              aria-hidden
              className="aspect-[4/3] rounded-md bg-gradient-to-br from-bg-elevated to-bg-card border border-border-subtle mb-3 flex items-center justify-center"
            >
              <span className="text-[64px] leading-none select-none">
                {e.muscleGroup === "Cardio" ? "🏃" : "💪"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{e.muscleGroup}</Badge>
              {e.isCustom && <Badge variant="info">Custom</Badge>}
            </div>
            <p className="mt-2 text-body-lg font-semibold text-text-primary truncate">
              {e.name}
            </p>
          </Card>
        ))}
      </div>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Adicionar exercício"
        description="Crie um exercício customizado disponível apenas para você."
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Nome" htmlFor="ex-name">
            <Input
              id="ex-name"
              name="name"
              required
              placeholder="ex: Supino articulado"
            />
          </Field>
          <Field label="Grupo muscular" htmlFor="ex-mg">
            <Select id="ex-mg" name="muscleGroup" required defaultValue="Peito">
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Instruções (opcional)" htmlFor="ex-instr">
            <Textarea
              id="ex-instr"
              name="instructions"
              placeholder="Como executar o movimento corretamente"
            />
          </Field>

          {error && (
            <p className="text-body text-error" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={submitting}>
              {submitting ? "Criando..." : "Criar"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
