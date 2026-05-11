"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { TODAY_ISO } from "@/lib/mock-data";

export default function NovaMedidaPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => router.push("/medidas"), 400);
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
          <Input id="date" type="date" defaultValue={TODAY_ISO} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Peso (kg)" htmlFor="weight">
            <Input
              id="weight"
              type="number"
              step={0.1}
              min={0}
              inputMode="decimal"
              placeholder="80.1"
            />
          </Field>
          <Field label="% Gordura" htmlFor="bf">
            <Input
              id="bf"
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
            <Input id="chest" type="number" step={0.1} placeholder="104" />
          </Field>
          <Field label="Cintura (cm)" htmlFor="waist">
            <Input id="waist" type="number" step={0.1} placeholder="87" />
          </Field>
          <Field label="Quadril (cm)" htmlFor="hip">
            <Input id="hip" type="number" step={0.1} placeholder="99" />
          </Field>
          <Field label="Braço (cm)" htmlFor="arm">
            <Input id="arm" type="number" step={0.1} placeholder="37.5" />
          </Field>
          <Field label="Coxa (cm)" htmlFor="thigh">
            <Input id="thigh" type="number" step={0.1} placeholder="60" />
          </Field>
          <Field label="Panturrilha (cm)" htmlFor="calf">
            <Input id="calf" type="number" step={0.1} placeholder="38" />
          </Field>
        </div>

        <Field label="Notas" htmlFor="notes">
          <Textarea
            id="notes"
            placeholder="Como você está se sentindo? Alguma observação?"
          />
        </Field>

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
