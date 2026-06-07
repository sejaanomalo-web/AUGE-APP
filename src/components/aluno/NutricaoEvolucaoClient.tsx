"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { NutritionEvolution } from "@/lib/actions/nutri-meal-logs";

const RANGES = [7, 30, 90] as const;

export interface NutricaoEvolucaoClientProps {
  data: NutritionEvolution;
}

export function NutricaoEvolucaoClient({ data }: NutricaoEvolucaoClientProps) {
  const router = useRouter();
  const { days, scheduledPerDay, targetCalories } = data;

  // ── Resumo do período ──
  const adherenceVals = days
    .map((d) => d.adherence)
    .filter((v): v is number => v != null);
  const avgAdherence =
    adherenceVals.length > 0
      ? Math.round(
          adherenceVals.reduce((a, b) => a + b, 0) / adherenceVals.length,
        )
      : null;
  const caloriesLoggedDays = days.filter((d) => d.calories > 0);
  const avgCalories =
    caloriesLoggedDays.length > 0
      ? Math.round(
          caloriesLoggedDays.reduce((a, b) => a + b.calories, 0) /
            caloriesLoggedDays.length,
        )
      : 0;
  const hydrationDays = days.filter((d) => d.hydration > 0);
  const avgHydration =
    hydrationDays.length > 0
      ? Math.round(
          hydrationDays.reduce((a, b) => a + b.hydration, 0) /
            hydrationDays.length,
        )
      : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Seletor de período ── */}
      <section className="flex flex-wrap items-center gap-2">
        {RANGES.map((r) => {
          const active = r === data.rangeDays;
          return (
            <button
              key={r}
              type="button"
              onClick={() => {
                if (active) return;
                router.push(`/nutricao/evolucao?range=${r}`, { scroll: false });
              }}
              className={cn(
                "h-10 px-4 rounded-pill border text-body font-semibold transition-colors",
                active
                  ? "bg-accent text-text-on-accent border-accent shadow-accent"
                  : "bg-bg-surface text-text-secondary border-border-subtle hover:text-text-primary hover:bg-bg-elevated",
              )}
            >
              {r} dias
            </button>
          );
        })}
      </section>

      {/* ── Resumo ── */}
      <section className="grid grid-cols-3 gap-3">
        <StatCard
          label="Aderência média"
          value={avgAdherence != null ? `${avgAdherence}%` : "—"}
        />
        <StatCard
          label="Calorias/dia"
          value={avgCalories > 0 ? `${avgCalories}` : "—"}
          suffix={avgCalories > 0 ? "kcal" : undefined}
        />
        <StatCard
          label="Hidratação/dia"
          value={
            avgHydration > 0 ? `${(avgHydration / 1000).toFixed(1)}` : "—"
          }
          suffix={avgHydration > 0 ? "L" : undefined}
        />
      </section>

      {/* ── Aderência ── */}
      <Card variant="default">
        <ChartHeader
          title="Aderência ao cardápio"
          hint={
            scheduledPerDay > 0
              ? `${scheduledPerDay} refeições/dia previstas`
              : "Sem cardápio ativo no período"
          }
        />
        <AreaChart
          values={days.map((d) => d.adherence ?? 0)}
          labels={days.map((d) => d.date)}
          maxValue={100}
          unit="%"
        />
      </Card>

      {/* ── Calorias ── */}
      <Card variant="default">
        <ChartHeader
          title="Calorias registradas"
          hint={
            targetCalories ? `Meta: ${targetCalories} kcal/dia` : undefined
          }
        />
        <BarChart
          values={days.map((d) => d.calories)}
          labels={days.map((d) => d.date)}
          target={targetCalories ?? undefined}
          unit="kcal"
        />
      </Card>

      {/* ── Hidratação ── */}
      <Card variant="default">
        <ChartHeader title="Hidratação" />
        <BarChart
          values={days.map((d) => d.hydration)}
          labels={days.map((d) => d.date)}
          unit="ml"
        />
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <Card variant="default" className="flex flex-col gap-1 py-3">
      <p className="text-stat-label uppercase text-text-muted">{label}</p>
      <p className="text-h2 text-text-primary font-mono-num">
        {value}
        {suffix && (
          <span className="text-caption text-text-muted ml-1">{suffix}</span>
        )}
      </p>
    </Card>
  );
}

function ChartHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-3">
      <p className="text-body-lg font-semibold text-text-primary">{title}</p>
      {hint && <p className="text-caption text-text-muted">{hint}</p>}
    </div>
  );
}

// ── Charts (SVG, auto-tinted via --accent) ──

const W = 320;
const H = 140;
const PAD_X = 22;
const PAD_TOP = 12;
const PAD_BOTTOM = 22;
const IW = W - PAD_X * 2;
const IH = H - PAD_TOP - PAD_BOTTOM;

function edgeLabels(labels: string[]): { first: string; last: string } {
  const fmt = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };
  return {
    first: labels.length ? fmt(labels[0]) : "",
    last: labels.length ? fmt(labels[labels.length - 1]) : "",
  };
}

function AreaChart({
  values,
  labels,
  maxValue,
  unit,
}: {
  values: number[];
  labels: string[];
  maxValue?: number;
  unit?: string;
}) {
  const max = maxValue ?? Math.max(...values, 1);
  const n = values.length;
  const pts = values.map((v, i) => {
    const x = PAD_X + (n <= 1 ? 0 : (i / (n - 1)) * IW);
    const y = PAD_TOP + (1 - v / max) * IH;
    return { x, y };
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const area =
    pts.length > 0
      ? `${line} L${pts[pts.length - 1].x.toFixed(1)},${PAD_TOP + IH} L${pts[0].x.toFixed(1)},${PAD_TOP + IH} Z`
      : "";
  const { first, last } = edgeLabels(labels);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Gráfico de aderência"
    >
      <defs>
        <linearGradient id="nutri-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => {
        const y = PAD_TOP + t * IH;
        return (
          <line
            key={t}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={y}
            y2={y}
            stroke="currentColor"
            className="text-border-subtle"
            strokeWidth="1"
            strokeDasharray={t === 1 ? "0" : "2 4"}
          />
        );
      })}
      {area && <path d={area} fill="url(#nutri-area)" />}
      {line && (
        <path
          d={line}
          fill="none"
          stroke="rgb(var(--accent))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <text x={PAD_X} y={H - 6} fontSize="9" className="fill-text-muted">
        {first}
      </text>
      <text
        x={W - PAD_X}
        y={H - 6}
        fontSize="9"
        textAnchor="end"
        className="fill-text-muted"
      >
        {last}
      </text>
      {unit && (
        <text x={PAD_X} y={PAD_TOP + 2} fontSize="9" className="fill-text-muted">
          {max}
          {unit}
        </text>
      )}
    </svg>
  );
}

function BarChart({
  values,
  labels,
  target,
  unit,
}: {
  values: number[];
  labels: string[];
  target?: number;
  unit?: string;
}) {
  const max = Math.max(...values, target ?? 0, 1);
  const n = values.length;
  const gap = n > 45 ? 1 : 2;
  const bw = Math.max(1, IW / n - gap);
  const { first, last } = edgeLabels(labels);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Gráfico de barras"
    >
      {[0, 0.5, 1].map((t) => {
        const y = PAD_TOP + t * IH;
        return (
          <line
            key={t}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={y}
            y2={y}
            stroke="currentColor"
            className="text-border-subtle"
            strokeWidth="1"
            strokeDasharray={t === 1 ? "0" : "2 4"}
          />
        );
      })}
      {values.map((v, i) => {
        const h = (v / max) * IH;
        const x = PAD_X + i * (IW / n) + gap / 2;
        const y = PAD_TOP + IH - h;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={bw}
            height={Math.max(0, h)}
            rx={bw > 3 ? 1.5 : 0}
            fill="rgb(var(--accent))"
            opacity={v > 0 ? 0.9 : 0}
          />
        );
      })}
      {target != null && target > 0 && (
        <line
          x1={PAD_X}
          x2={W - PAD_X}
          y1={PAD_TOP + (1 - target / max) * IH}
          y2={PAD_TOP + (1 - target / max) * IH}
          stroke="rgb(var(--accent))"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.7"
        />
      )}
      <text x={PAD_X} y={H - 6} fontSize="9" className="fill-text-muted">
        {first}
      </text>
      <text
        x={W - PAD_X}
        y={H - 6}
        fontSize="9"
        textAnchor="end"
        className="fill-text-muted"
      >
        {last}
      </text>
      {unit && (
        <text x={PAD_X} y={PAD_TOP + 2} fontSize="9" className="fill-text-muted">
          {max}
          {unit}
        </text>
      )}
    </svg>
  );
}
