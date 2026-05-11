"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { addMetric } from "@/lib/actions/body-metrics";

function pickNumber(form: FormData, key: string): number | undefined {
  const raw = form.get(key);
  if (typeof raw !== "string" || raw.trim() === "") return undefined;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : undefined;
}

export default function NovaMedidaPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const date = (form.get("date") as string) || new Date().toISOString().slice(0, 10);
    const weight = pickNumber(form, "weight");
    const bodyFat = pickNumber(form, "bodyFat");
    const chest = pickNumber(form, "chest");
    const waist = pickNumber(form, "waist");
    const hip = pickNumber(form, "hip");
    const arm = pickNumber(form, "arm");
    const thigh = pickNumber(form, "thigh");
    const calf = pickNumber(form, "calf");
    const notes = (form.get("notes") as string)?.trim() || undefined;

    const measurements: Record<string, number> = {};
    if (chest != null) measurements.chest = chest;
    if (waist != null) measurements.waist = waist;
    if (hip != null) measurements.hip = hip;
    if (arm != null) measurements.arm = arm;
    if (thigh != null) measurements.thigh = thigh;
    if (calf != null) measurements.calf = calf;

    try {
      await addMetric({
        date: new Date(date),
        weight,
        bodyFat,
        measurements: Object.keys(measurements).length > 0 ? measurements : undefined,
        notes,
      });
      router.push("/medidas");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/medidas">
          <IconButton aria-label="Voltar">
            <ChevronLeft size={20} />
          </IconButton>
        </Link>
        <h1 className="text-h1 text-text-primary">Nova medida</h1>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Data" htmlFor="date">
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Peso (kg)" htmlFor="weight">
            <Input
              id="weight"
              name="weight"
              type="number"
              step={0.1}
              min={0}
              inputMode="decimal"
              placeholder="80.1"
            />
          </Field>
          <Field label="% Gordura" htmlFor="bodyFat">
            <Input
              id="bodyFat"
              name="bodyFat"
              type="number"
              step={0.1}
              min={0}
              inputMode="decimal"
              placeholder="18.5"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Peitoral (cm)" htmlFor="chest">
            <Input id="chest" name="chest" type="number" step={0.1} />
          </Field>
          <Field label="Cintura (cm)" htmlFor="waist">
            <Input id="waist" name="waist" type="number" step={0.1} />
          </Field>
          <Field label="Quadril (cm)" htmlFor="hip">
            <Input id="hip" name="hip" type="number" step={0.1} />
          </Field>
          <Field label="Braço (cm)" htmlFor="arm">
            <Input id="arm" name="arm" type="number" step={0.1} />
          </Field>
          <Field label="Coxa (cm)" htmlFor="thigh">
            <Input id="thigh" name="thigh" type="number" step={0.1} />
          </Field>
          <Field label="Panturrilha (cm)" htmlFor="calf">
            <Input id="calf" name="calf" type="number" step={0.1} />
          </Field>
        </div>

        <Field label="Notas" htmlFor="notes">
          <Textarea
            id="notes"
            name="notes"
            placeholder="Como você está se sentindo? Alguma observação?"
          />
        </Field>

        {error && (
          <p className="text-body text-error" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 mt-4">
          <Link href="/medidas">
            <Button variant="secondary" size="md" type="button">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="cta"
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? "Salvando..." : "Salvar medida"}
          </Button>
        </div>
      </form>
    </div>
  );
}
