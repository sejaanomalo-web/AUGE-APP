"use client";

import * as React from "react";
import {
  differenceInCalendarDays,
  eachMonthOfInterval,
  eachWeekOfInterval,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export interface WorkoutBarChartItem {
  date: Date;
}

/**
 * Self-explanatory vertical bar chart of workouts per period.
 *
 * Picks the period granularity automatically:
 *   - range ≤ ~75 days → one bar per week
 *   - longer range → one bar per month
 *
 * Each bar shows its count on top + a date label below. Zero-count
 * periods still render so you can see gaps without doing math.
 */
export function WorkoutBarChart({
  workouts,
}: {
  workouts: WorkoutBarChartItem[];
}) {
  if (workouts.length === 0) {
    return (
      <p className="text-body text-text-secondary">
        Nenhum treino no período selecionado.
      </p>
    );
  }

  const sorted = [...workouts].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  const first = sorted[0].date;
  const last = sorted[sorted.length - 1].date;
  const spanDays = differenceInCalendarDays(last, first);
  const groupBy: "week" | "month" = spanDays > 75 ? "month" : "week";

  // Build buckets covering the full range.
  let buckets: { key: string; label: string; count: number }[];
  if (groupBy === "month") {
    const months = eachMonthOfInterval({
      start: startOfMonth(first),
      end: startOfMonth(last),
    }).slice(-12);
    buckets = months.map((m) => {
      const key = format(m, "yyyy-MM");
      return {
        key,
        label: format(m, "MMM", { locale: ptBR }),
        count: 0,
      };
    });
    for (const w of sorted) {
      const k = format(startOfMonth(w.date), "yyyy-MM");
      const bucket = buckets.find((b) => b.key === k);
      if (bucket) bucket.count += 1;
    }
  } else {
    const weeks = eachWeekOfInterval(
      {
        start: startOfWeek(first, { weekStartsOn: 1 }),
        end: startOfWeek(last, { weekStartsOn: 1 }),
      },
      { weekStartsOn: 1 },
    ).slice(-12);
    buckets = weeks.map((w) => {
      const key = format(w, "yyyy-'W'II");
      return {
        key,
        label: format(w, "dd/MM"),
        count: 0,
      };
    });
    for (const w of sorted) {
      const k = format(
        startOfWeek(w.date, { weekStartsOn: 1 }),
        "yyyy-'W'II",
      );
      const bucket = buckets.find((b) => b.key === k);
      if (bucket) bucket.count += 1;
    }
  }

  const max = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div>
      <div className="flex justify-between items-baseline mb-3">
        <p className="text-stat-label uppercase text-text-muted">
          Treinos por {groupBy === "month" ? "mês" : "semana"}
        </p>
        <p className="text-caption text-text-muted">
          {buckets.length} {groupBy === "month" ? "meses" : "semanas"}
        </p>
      </div>

      <div className="flex items-end gap-2 sm:gap-3 h-[160px]">
        {buckets.map((b) => {
          const heightPct = (b.count / max) * 100;
          const hasValue = b.count > 0;
          return (
            <div
              key={b.key}
              className="flex-1 min-w-0 flex flex-col items-center gap-1 h-full"
            >
              <span
                className={`text-caption font-bold tnum ${
                  hasValue ? "text-text-primary" : "text-text-muted"
                }`}
              >
                {b.count}
              </span>
              <div className="flex-1 w-full flex items-end">
                <div
                  className={`w-full rounded-sm transition-all duration-300 ${
                    hasValue ? "bg-accent" : "bg-bg-elevated"
                  }`}
                  style={{
                    height: hasValue
                      ? `${Math.max(heightPct, 6)}%`
                      : "4px",
                  }}
                />
              </div>
              <span className="text-[10px] text-text-muted truncate max-w-full">
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
