"use client";

import * as React from "react";
import Link from "next/link";
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  isSameDay,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import { HeroCard } from "@/components/visual/HeroCard";
import { capitalize } from "@/lib/date";
import { cn } from "@/lib/utils";

export interface ProjectedSession {
  dateIso: string;
  sessionId: string;
  sessionName: string;
  exerciseCount: number;
}

type Period = "today" | "week" | "month" | "year";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Hoje",
  week: "Esta semana",
  month: "Mês",
  year: "Ano",
};
const PERIODS: Period[] = ["today", "week", "month", "year"];

function inPeriod(date: Date, period: Period, now: Date) {
  if (period === "today") return isSameDay(date, now);
  if (period === "week") {
    return isWithinInterval(date, {
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 }),
    });
  }
  if (period === "month") {
    return isWithinInterval(date, {
      start: startOfMonth(now),
      end: endOfMonth(now),
    });
  }
  return isWithinInterval(date, {
    start: startOfYear(now),
    end: endOfYear(now),
  });
}

export function TreinosByPeriod({
  projected,
}: {
  projected: ProjectedSession[];
}) {
  // "Esta semana" is the default per the spec.
  const [period, setPeriod] = React.useState<Period>("week");
  const now = React.useMemo(() => new Date(), []);
  const todayKey = React.useMemo(
    () => now.toISOString().slice(0, 10),
    [now],
  );

  const filtered = React.useMemo(
    () => projected.filter((p) => inPeriod(new Date(p.dateIso), period, now)),
    [projected, period, now],
  );

  return (
    <section className="flex flex-col gap-4">
      {/* Filter pills */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none">
        <div
          role="tablist"
          aria-label="Filtrar treinos por período"
          className="inline-flex items-center gap-1 p-1 rounded-pill bg-bg-surface border border-border-subtle"
        >
          {PERIODS.map((p) => {
            const active = p === period;
            return (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 h-9 rounded-pill text-caption font-semibold whitespace-nowrap transition-colors",
                  active
                    ? "bg-accent text-text-on-accent shadow-accent"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated",
                )}
              >
                {PERIOD_LABELS[p]}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <HeroCard bare className="p-6">
          <p className="text-body text-text-secondary text-center">
            Nenhum treino programado nesse período.
          </p>
        </HeroCard>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((p, i) => {
            const date = new Date(p.dateIso);
            const isToday = p.dateIso.slice(0, 10) === todayKey;
            const dateLabel = capitalize(
              format(date, "EEE, dd 'de' MMM", { locale: ptBR }),
            );
            return (
              <Link
                key={`${p.sessionId}-${p.dateIso}-${i}`}
                href={`/treino/${p.sessionId}`}
                className="block"
              >
                <HeroCard
                  intensity={isToday ? "strong" : "medium"}
                  className={cn(
                    "p-4 flex items-center gap-4 transition duration-150",
                    "hover:-translate-y-px hover:border-border",
                    isToday && "ring-1 ring-accent/30 shadow-accent",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-stat-label uppercase",
                        isToday ? "text-accent" : "text-text-muted",
                      )}
                    >
                      {isToday ? "Hoje" : dateLabel}
                    </p>
                    <p className="mt-1 text-h3 text-text-primary truncate">
                      {p.sessionName}
                    </p>
                    <p className="mt-0.5 text-caption text-text-muted">
                      {p.exerciseCount} exercícios
                    </p>
                  </div>
                </HeroCard>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
