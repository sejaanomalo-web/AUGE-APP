"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  ClipboardList,
  ImageIcon,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { HeroCard } from "@/components/visual/HeroCard";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  addEvaluation,
  deleteEvaluation,
  type EvaluationListItem,
} from "@/lib/actions/body-metrics";
import { cn } from "@/lib/utils";

const MEASUREMENT_FIELDS: Array<{
  key: "height" | "waist" | "arm" | "thigh" | "hip" | "chest";
  label: string;
  unit: string;
  placeholder: string;
  max: number;
}> = [
  { key: "height", label: "Altura", unit: "cm", placeholder: "175", max: 300 },
  { key: "waist", label: "Cintura", unit: "cm", placeholder: "82", max: 250 },
  { key: "hip", label: "Quadril", unit: "cm", placeholder: "98", max: 250 },
  { key: "chest", label: "Peito", unit: "cm", placeholder: "100", max: 250 },
  { key: "arm", label: "Braço", unit: "cm", placeholder: "38", max: 250 },
  { key: "thigh", label: "Coxa", unit: "cm", placeholder: "58", max: 250 },
];

const MEASUREMENT_LABEL: Record<string, { label: string; unit: string }> = {
  height: { label: "Altura", unit: "cm" },
  waist: { label: "Cintura", unit: "cm" },
  hip: { label: "Quadril", unit: "cm" },
  chest: { label: "Peito", unit: "cm" },
  arm: { label: "Braço", unit: "cm" },
  thigh: { label: "Coxa", unit: "cm" },
};

function brDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function todayIso() {
  const d = new Date();
  const tz = d.getTimezoneOffset();
  return new Date(d.getTime() - tz * 60_000).toISOString().slice(0, 10);
}

export function EvolucaoEvaluations({
  initialEvaluations,
  schemaMissing,
}: {
  initialEvaluations: EvaluationListItem[];
  schemaMissing?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = React.useState(initialEvaluations);
  const [open, setOpen] = React.useState(false);

  async function handleDelete(id: string) {
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    const res = await deleteEvaluation(id);
    if (!res.ok) {
      setItems(snapshot);
      window.alert(res.error);
    } else {
      router.refresh();
    }
  }

  function handleCreated() {
    setOpen(false);
    router.refresh();
  }

  if (schemaMissing) {
    return (
      <section className="flex flex-col gap-3">
        <header>
          <h2 className="text-h2 text-text-primary">Avaliação física</h2>
          <p className="text-body text-text-secondary mt-1">
            Registre peso, medidas e fotos para acompanhar sua evolução.
          </p>
        </header>
        <HeroCard className="p-5">
          <p className="text-body text-text-primary font-semibold">
            Recurso quase pronto
          </p>
          <p className="text-body text-text-secondary mt-1">
            A tabela de avaliações ainda não foi migrada neste ambiente. Aplique
            a migração <span className="font-mono-num">
              20260518_bodymetric_photo
            </span> no banco para liberar.
          </p>
        </HeroCard>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-h2 text-text-primary">Avaliação física</h2>
          <p className="text-body text-text-secondary mt-1">
            Registre peso, medidas e fotos para acompanhar sua evolução.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setOpen(true)}
        >
          <Plus size={14} aria-hidden /> Nova avaliação
        </Button>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma avaliação registrada"
          description="Tire fotos, anote peso e medidas e veja sua evolução ao longo do tempo. Capriche na consistência: uma avaliação por mês é suficiente."
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => setOpen(true)}
            >
              <Plus size={16} aria-hidden /> Registrar primeira avaliação
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((evaluation) => (
            <EvaluationCard
              key={evaluation.id}
              evaluation={evaluation}
              onDelete={() => handleDelete(evaluation.id)}
            />
          ))}
        </div>
      )}

      <AddEvaluationDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={handleCreated}
      />
    </section>
  );
}

function EvaluationCard({
  evaluation,
  onDelete,
}: {
  evaluation: EvaluationListItem;
  onDelete: () => void;
}) {
  const chips: Array<{ key: string; label: string }> = [];
  if (evaluation.weight !== null) {
    chips.push({ key: "weight", label: `${evaluation.weight} kg` });
  }
  if (evaluation.bodyFat !== null) {
    chips.push({ key: "bodyFat", label: `${evaluation.bodyFat}% gordura` });
  }
  if (evaluation.measurements) {
    for (const [k, v] of Object.entries(evaluation.measurements)) {
      const meta = MEASUREMENT_LABEL[k] ?? { label: k, unit: "" };
      chips.push({ key: k, label: `${meta.label} ${v} ${meta.unit}`.trim() });
    }
  }

  return (
    <HeroCard intensity="subtle" className="p-4">
      <div className="flex items-start gap-4">
        {evaluation.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <a
            href={evaluation.photoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-border-subtle bg-bg-elevated block hover:opacity-90 transition"
            aria-label="Abrir foto em tamanho real"
          >
            <img
              src={evaluation.photoUrl}
              alt="Foto da avaliação"
              className="w-full h-full object-cover"
            />
          </a>
        ) : (
          <div className="shrink-0 w-20 h-20 rounded-xl border border-border-subtle bg-bg-elevated flex items-center justify-center text-text-muted">
            <ImageIcon size={22} aria-hidden />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-stat-label uppercase text-text-muted">
            {brDate(evaluation.dateIso)}
          </p>
          {chips.length === 0 && !evaluation.notes ? (
            <p className="mt-1 text-body text-text-secondary">
              Avaliação registrada sem métricas.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <span
                  key={c.key}
                  className="inline-flex items-center px-2.5 h-7 rounded-pill bg-bg-elevated border border-border-subtle text-caption text-text-secondary font-semibold"
                >
                  {c.label}
                </span>
              ))}
            </div>
          )}
          {evaluation.notes && (
            <p className="mt-2 text-body text-text-secondary line-clamp-3">
              {evaluation.notes}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onDelete}
          aria-label="Remover avaliação"
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-error hover:bg-error/10 transition-colors"
        >
          <Trash2 size={15} aria-hidden />
        </button>
      </div>
    </HeroCard>
  );
}

function AddEvaluationDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [date, setDate] = React.useState(todayIso());
  const [weight, setWeight] = React.useState("");
  const [bodyFat, setBodyFat] = React.useState("");
  const [measurements, setMeasurements] = React.useState<
    Record<string, string>
  >({});
  const [notes, setNotes] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Object URL for preview - revoke when file changes / dialog closes.
  const previewUrl = React.useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Reset state every time the dialog opens.
  React.useEffect(() => {
    if (!open) return;
    setDate(todayIso());
    setWeight("");
    setBodyFat("");
    setMeasurements({});
    setNotes("");
    setFile(null);
    setError(null);
  }, [open]);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      setError("Foto maior que 4 MB. Escolha uma imagem menor.");
      e.target.value = "";
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("Use JPG, PNG ou WebP.");
      e.target.value = "";
      return;
    }
    setError(null);
    setFile(f);
  }

  async function submit() {
    setError(null);
    setSubmitting(true);
    const fd = new FormData();
    fd.set("date", date);
    if (weight) fd.set("weight", weight);
    if (bodyFat) fd.set("bodyFat", bodyFat);
    for (const m of MEASUREMENT_FIELDS) {
      const v = measurements[m.key];
      if (v) fd.set(m.key, v);
    }
    if (notes.trim()) fd.set("notes", notes.trim());
    if (file) fd.set("photo", file);
    const res = await addEvaluation(fd);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onCreated();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !submitting && onOpenChange(o)}
      title="Nova avaliação"
      description="Preencha os campos que tiver à mão. Você pode atualizar a qualquer momento."
      footer={
        <>
          <Button
            variant="secondary"
            size="md"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? "Salvando..." : "Salvar avaliação"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Date + headline metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Data" htmlFor="eval-date">
            <Input
              id="eval-date"
              type="date"
              value={date}
              max={todayIso()}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Peso (kg)" htmlFor="eval-weight">
            <Input
              id="eval-weight"
              type="number"
              inputMode="decimal"
              step={0.1}
              min={0}
              max={500}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="78.4"
            />
          </Field>
          <Field label="% gordura" htmlFor="eval-bodyfat">
            <Input
              id="eval-bodyfat"
              type="number"
              inputMode="decimal"
              step={0.1}
              min={0}
              max={100}
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              placeholder="18"
            />
          </Field>
        </div>

        {/* Measurements (all optional, cm). */}
        <div>
          <p className="text-stat-label uppercase text-text-muted mb-2">
            Medidas (cm)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MEASUREMENT_FIELDS.map((m) => (
              <Field key={m.key} label={m.label} htmlFor={`eval-${m.key}`}>
                <Input
                  id={`eval-${m.key}`}
                  type="number"
                  inputMode="decimal"
                  step={0.1}
                  min={0}
                  max={m.max}
                  value={measurements[m.key] ?? ""}
                  onChange={(e) =>
                    setMeasurements((prev) => ({
                      ...prev,
                      [m.key]: e.target.value,
                    }))
                  }
                  placeholder={m.placeholder}
                />
              </Field>
            ))}
          </div>
        </div>

        {/* Notes */}
        <Field label="Notas" htmlFor="eval-notes">
          <Textarea
            id="eval-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Como foi a semana? Variações de sono, alimentação, dores..."
            rows={3}
          />
        </Field>

        {/* Photo upload */}
        <div>
          <p className="text-stat-label uppercase text-text-muted mb-2">
            Foto (opcional)
          </p>
          {previewUrl ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Pré-visualização"
                className="w-20 h-20 object-cover rounded-xl border border-border-subtle"
              />
              <div className="flex-1 min-w-0">
                <p className="text-body text-text-primary font-semibold truncate">
                  {file?.name}
                </p>
                <p className="text-caption text-text-muted">
                  {(file?.size ?? 0) / 1024 < 1024
                    ? `${Math.round((file?.size ?? 0) / 1024)} KB`
                    : `${((file?.size ?? 0) / 1024 / 1024).toFixed(1)} MB`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                aria-label="Remover foto"
                className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-error hover:bg-error/10 transition-colors"
              >
                <X size={16} aria-hidden />
              </button>
            </div>
          ) : (
            <label
              htmlFor="eval-photo"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border-subtle bg-bg-elevated hover:bg-bg-hover hover:border-accent/50 transition-colors cursor-pointer",
              )}
            >
              <span className="h-10 w-10 rounded-full bg-bg-card border border-border-subtle flex items-center justify-center text-text-secondary">
                <Camera size={18} aria-hidden />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-body text-text-primary font-semibold">
                  Anexar foto
                </p>
                <p className="text-caption text-text-muted">
                  JPG, PNG ou WebP - máximo 4 MB
                </p>
              </div>
            </label>
          )}
          <input
            ref={fileInputRef}
            id="eval-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onPickFile}
          />
        </div>

        {error && (
          <p className="text-body text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
