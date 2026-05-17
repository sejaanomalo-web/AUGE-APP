"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Activity, Dumbbell, Plus, Target, Trash2 } from "lucide-react";
import { HeroCard } from "@/components/visual/HeroCard";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { EmptyState } from "@/components/shared/EmptyState";
import { createGoal, deleteGoal } from "@/lib/actions/goals";
import type { GoalWithProgress } from "@/lib/actions/goals";
import { cn } from "@/lib/utils";

const PERIOD_LABEL: Record<GoalWithProgress["period"], string> = {
  WEEK: "esta semana",
  MONTH: "este mês",
  YEAR: "este ano",
};

const SPORT_PRESETS: {
  sport: string;
  metric: GoalWithProgress["metric"];
  icon: typeof Dumbbell;
  unit: string;
  placeholderTarget: string;
  periodDefault: GoalWithProgress["period"];
}[] = [
  {
    sport: "Musculação",
    metric: "WORKOUT_COUNT",
    icon: Dumbbell,
    unit: "treinos",
    placeholderTarget: "4",
    periodDefault: "WEEK",
  },
  {
    sport: "Corrida",
    metric: "DISTANCE_KM",
    icon: Activity,
    unit: "km",
    placeholderTarget: "20",
    periodDefault: "WEEK",
  },
];

export function ObjetivosClient({
  initialGoals,
  availableSports,
}: {
  initialGoals: GoalWithProgress[];
  availableSports: string[];
}) {
  const router = useRouter();
  const [goals, setGoals] = React.useState(initialGoals);
  const [addOpen, setAddOpen] = React.useState(false);

  async function handleDelete(id: string) {
    // Optimistic remove; reconcile on error.
    const snapshot = goals;
    setGoals((g) => g.filter((x) => x.id !== id));
    const res = await deleteGoal(id);
    if (!res.ok) {
      setGoals(snapshot);
      window.alert(res.error);
    } else {
      router.refresh();
    }
  }

  function handleCreated() {
    setAddOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-stat-label uppercase text-text-muted">
          {goals.length} {goals.length === 1 ? "meta ativa" : "metas ativas"}
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setAddOpen(true)}
        >
          <Plus size={14} aria-hidden /> Nova meta
        </Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Sem metas ainda"
          description="Crie uma meta com base nos esportes que você pratica. Defina quantos treinos por semana ou quantos km por mês e acompanhe o progresso aqui."
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => setAddOpen(true)}
            >
              <Plus size={16} aria-hidden /> Criar primeira meta
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} onDelete={() => handleDelete(g.id)} />
          ))}
        </div>
      )}

      <AddGoalDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        availableSports={availableSports}
        onCreated={handleCreated}
        existingKeys={goals.map(
          (g) => `${g.sport}__${g.metric}__${g.period}`,
        )}
      />
    </div>
  );
}

function GoalCard({
  goal,
  onDelete,
}: {
  goal: GoalWithProgress;
  onDelete: () => void;
}) {
  const reached = goal.pct >= 100;
  const preset = SPORT_PRESETS.find(
    (p) => p.sport === goal.sport && p.metric === goal.metric,
  );
  const Icon = preset?.icon ?? Target;
  const unit =
    goal.metric === "WORKOUT_COUNT"
      ? goal.target === 1
        ? "treino"
        : "treinos"
      : "km";

  const currentDisplay =
    goal.metric === "WORKOUT_COUNT"
      ? Math.round(goal.current).toString()
      : goal.current.toFixed(1);
  const targetDisplay =
    goal.metric === "WORKOUT_COUNT"
      ? Math.round(goal.target).toString()
      : goal.target.toFixed(goal.target % 1 === 0 ? 0 : 1);

  return (
    <HeroCard
      intensity={reached ? "strong" : "medium"}
      className={cn(
        "p-5",
        reached && "ring-1 ring-success/40",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-11 w-11 rounded-full flex items-center justify-center shrink-0 border",
            reached
              ? "bg-success/15 border-success/40 text-success"
              : "bg-accent/10 border-accent/25 text-accent",
          )}
        >
          <Icon size={20} aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-stat-label uppercase text-text-muted">
            {goal.sport} · {PERIOD_LABEL[goal.period]}
          </p>
          <p className="mt-1 text-h2 text-text-primary">
            <span className="font-mono-num tnum">{currentDisplay}</span>
            <span className="text-text-muted"> / {targetDisplay} </span>
            <span className="text-body-lg text-text-secondary font-normal">
              {unit}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Remover meta"
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-error hover:bg-error/10 transition-colors"
        >
          <Trash2 size={15} aria-hidden />
        </button>
      </div>

      <div className="mt-4">
        <Progress value={goal.current} max={goal.target || 1} />
        <p className="mt-2 text-caption text-text-muted">
          {reached
            ? "Meta batida. Mantém a constância."
            : `Faltam ${
                goal.metric === "WORKOUT_COUNT"
                  ? Math.max(0, Math.ceil(goal.target - goal.current))
                  : Math.max(0, goal.target - goal.current).toFixed(1)
              } ${unit} para fechar ${PERIOD_LABEL[goal.period]}.`}
        </p>
      </div>
    </HeroCard>
  );
}

function AddGoalDialog({
  open,
  onOpenChange,
  availableSports,
  onCreated,
  existingKeys,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  availableSports: string[];
  onCreated: () => void;
  existingKeys: string[];
}) {
  const presets = SPORT_PRESETS.filter((p) =>
    availableSports.length === 0 ? true : availableSports.includes(p.sport),
  );
  const [presetIdx, setPresetIdx] = React.useState(0);
  const preset = presets[presetIdx];
  const [target, setTarget] = React.useState("");
  const [period, setPeriod] = React.useState<GoalWithProgress["period"]>(
    preset?.periodDefault ?? "WEEK",
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset state when the dialog opens or the preset changes.
  React.useEffect(() => {
    if (!open) return;
    setPresetIdx(0);
    setError(null);
  }, [open]);
  React.useEffect(() => {
    if (!preset) return;
    setPeriod(preset.periodDefault);
    setTarget("");
  }, [preset]);

  async function submit() {
    if (!preset) return;
    setError(null);
    const num = Number(target.replace(",", "."));
    if (!Number.isFinite(num) || num <= 0) {
      setError("Informe um número maior que zero.");
      return;
    }
    const key = `${preset.sport}__${preset.metric}__${period}`;
    if (existingKeys.includes(key)) {
      setError(
        "Você já tem uma meta ativa desse tipo. Remova a anterior antes.",
      );
      return;
    }
    setSubmitting(true);
    const res = await createGoal({
      sport: preset.sport,
      metric: preset.metric,
      target: num,
      period,
    });
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
      title="Nova meta"
      description="Escolha um esporte, a quantidade e o período."
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
            disabled={submitting || !preset}
          >
            {submitting ? "Salvando…" : "Criar meta"}
          </Button>
        </>
      }
    >
      {presets.length === 0 ? (
        <p className="text-body text-text-secondary">
          Selecione no seu perfil quais esportes você pratica para liberar
          metas (Musculação ou Corrida).
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Esporte */}
          <div>
            <p className="text-stat-label uppercase text-text-muted mb-2">
              Esporte
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presets.map((p, i) => {
                const PIcon = p.icon;
                const active = i === presetIdx;
                return (
                  <button
                    key={p.sport + p.metric}
                    type="button"
                    onClick={() => setPresetIdx(i)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border text-left transition-colors",
                      active
                        ? "bg-accent/10 border-accent text-text-primary"
                        : "bg-bg-elevated border-border-subtle text-text-secondary hover:text-text-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                        active
                          ? "bg-accent text-text-on-accent"
                          : "bg-bg-card text-text-muted",
                      )}
                    >
                      <PIcon size={16} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-body">{p.sport}</p>
                      <p className="text-caption text-text-muted">
                        Meta em {p.unit}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meta + Período */}
          {preset && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={`Meta (${preset.unit})`} htmlFor="goal-target">
                <Input
                  id="goal-target"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={preset.metric === "DISTANCE_KM" ? 0.5 : 1}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder={preset.placeholderTarget}
                />
              </Field>
              <Field label="Período">
                <div className="flex gap-1 p-1 bg-bg-elevated border border-border-subtle rounded-pill">
                  {(["WEEK", "MONTH", "YEAR"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      className={cn(
                        "flex-1 h-9 rounded-pill text-caption font-semibold transition-colors",
                        period === p
                          ? "bg-accent text-text-on-accent"
                          : "text-text-secondary hover:text-text-primary",
                      )}
                    >
                      {p === "WEEK"
                        ? "Semana"
                        : p === "MONTH"
                          ? "Mês"
                          : "Ano"}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {error && (
            <p className="text-body text-error" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
}
