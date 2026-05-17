"use client";

import * as React from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

export interface EvolucaoCalendarProps {
  year: number;
  month: number; // 0-11
  trainedDates: Set<string>;
  /** When true, dim everything outside the current week. */
  thisWeekOnly?: boolean;
}

function toKey(d: Date) {
  // Local date YYYY-MM-DD (avoid UTC drift on day boundaries).
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function EvolucaoCalendar({
  year,
  month,
  trainedDates,
  thisWeekOnly = false,
}: EvolucaoCalendarProps) {
  const today = React.useMemo(() => new Date(), []);
  const todayKey = toKey(today);

  // Build a 6-row grid that covers the month + padding from Sun-start week.
  const monthAnchor = new Date(year, month, 1);
  const gridStart = startOfWeek(startOfMonth(monthAnchor), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(monthAnchor), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // "Esta semana" highlight bounds (only used if thisWeekOnly).
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
  const isInWeek = (d: Date) => d >= weekStart && d <= weekEnd;

  const monthLabel = monthAnchor.toLocaleString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-stat-label uppercase text-text-muted">
        {monthLabel}
      </p>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((w, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-bold tracking-wider text-text-muted uppercase"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const key = toKey(d);
          const inMonth = isSameMonth(d, monthAnchor);
          const trained = trainedDates.has(key);
          const isToday = key === todayKey;
          const isFuture = d > today;
          const dimmed = thisWeekOnly && !isInWeek(d);

          // Status flag → mark
          //   trained         → check (accent)
          //   past, no workout→ x (muted)
          //   future          → nothing (just number)
          let mark: React.ReactNode = null;
          if (trained) {
            mark = (
              <Check
                size={12}
                strokeWidth={3}
                className="text-text-on-accent"
                aria-hidden
              />
            );
          } else if (!isFuture && inMonth) {
            mark = <X size={10} className="text-text-muted/70" aria-hidden />;
          }

          return (
            <div
              key={key}
              className={cn(
                "relative aspect-square flex flex-col items-center justify-center rounded-md text-[11px] sm:text-caption font-semibold transition-colors",
                inMonth ? "text-text-primary" : "text-text-muted/40",
                trained && inMonth && "bg-accent text-text-on-accent",
                !trained &&
                  inMonth &&
                  !isFuture &&
                  "bg-bg-elevated border border-border-subtle",
                !trained &&
                  inMonth &&
                  isFuture &&
                  "border border-dashed border-border-subtle",
                isToday && "ring-2 ring-accent ring-offset-2 ring-offset-bg-base",
                dimmed && "opacity-25",
              )}
              aria-label={`${d.getDate()}${
                trained ? " · treinou" : isFuture ? "" : " · sem treino"
              }`}
            >
              <span className="leading-none">{d.getDate()}</span>
              {mark && <span className="mt-0.5">{mark}</span>}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-1 text-caption text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-accent" /> treinou
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-bg-elevated border border-border-subtle" />{" "}
          sem treino
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm border border-dashed border-border-subtle" />{" "}
          futuro
        </span>
      </div>
    </div>
  );
}
