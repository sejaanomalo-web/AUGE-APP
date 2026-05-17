"use client";

import * as React from "react";

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export interface EvolucaoFrequencyChartProps {
  /** Length 12, indexed 0=Jan ... 11=Dez. */
  monthlyCounts: number[];
  /** Highlight which month is currently selected (0-11). */
  selectedMonth?: number;
  year: number;
}

const WIDTH = 320;
const HEIGHT = 140;
const PAD_X = 24;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;
const innerW = WIDTH - PAD_X * 2;
const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;

export function EvolucaoFrequencyChart({
  monthlyCounts,
  selectedMonth,
  year,
}: EvolucaoFrequencyChartProps) {
  const max = Math.max(...monthlyCounts, 1);
  const today = new Date();
  const lastMonth =
    today.getFullYear() === year ? today.getMonth() : 11;

  // Compute point coords (only for months ≤ lastMonth).
  const points = monthlyCounts.slice(0, lastMonth + 1).map((c, i) => {
    const x = PAD_X + (i / 11) * innerW;
    const y = PAD_TOP + (1 - c / max) * innerH;
    return { x, y, count: c, month: i };
  });

  // Build path d-string and a closed area fill.
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1].x.toFixed(1)},${PAD_TOP + innerH} L${points[0].x.toFixed(1)},${PAD_TOP + innerH} Z`
      : "";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-stat-label uppercase text-text-muted">
          Frequência {year}
        </p>
        <p className="text-caption text-text-muted">
          {monthlyCounts.reduce((a, b) => a + b, 0)} treinos no ano
        </p>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Frequência mensal em ${year}`}
      >
        <defs>
          <linearGradient id="freq-area" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="rgb(var(--accent))"
              stopOpacity="0.35"
            />
            <stop
              offset="100%"
              stopColor="rgb(var(--accent))"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {/* Gridlines (3 horizontal divisions) */}
        {[0, 0.5, 1].map((t) => {
          const y = PAD_TOP + t * innerH;
          return (
            <line
              key={t}
              x1={PAD_X}
              x2={WIDTH - PAD_X}
              y1={y}
              y2={y}
              stroke="currentColor"
              className="text-border-subtle"
              strokeWidth="1"
              strokeDasharray={t === 1 ? "0" : "2 4"}
            />
          );
        })}

        {/* Area fill */}
        {areaPath && <path d={areaPath} fill="url(#freq-area)" />}

        {/* Line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="rgb(var(--accent))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Dots */}
        {points.map((p) => {
          const isSelected = p.month === selectedMonth;
          return (
            <g key={p.month}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isSelected ? 5 : 3.5}
                fill="rgb(var(--accent))"
                stroke="rgb(var(--bg-base))"
                strokeWidth={isSelected ? 3 : 2}
              />
              {isSelected && p.count > 0 && (
                <text
                  x={p.x}
                  y={Math.max(p.y - 10, PAD_TOP + 6)}
                  textAnchor="middle"
                  className="fill-text-primary font-mono-num"
                  fontSize="11"
                  fontWeight={700}
                >
                  {p.count}
                </text>
              )}
            </g>
          );
        })}

        {/* X-axis month labels */}
        {MONTH_LABELS.map((label, i) => {
          const x = PAD_X + (i / 11) * innerW;
          const isSelected = i === selectedMonth;
          return (
            <text
              key={label}
              x={x}
              y={HEIGHT - 6}
              textAnchor="middle"
              fontSize="9"
              fontWeight={isSelected ? 700 : 500}
              className={
                isSelected ? "fill-accent" : "fill-text-muted"
              }
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
