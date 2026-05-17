"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HeroCard } from "@/components/visual/HeroCard";
import { EvolucaoCalendar } from "./EvolucaoCalendar";
import { EvolucaoFrequencyChart } from "./EvolucaoFrequencyChart";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export interface EvolucaoClientProps {
  year: number;
  trainedDates: string[];
  monthlyCounts: number[];
  firstYearWithData: number;
}

export function EvolucaoClient({
  year,
  trainedDates,
  monthlyCounts,
  firstYearWithData,
}: EvolucaoClientProps) {
  const router = useRouter();
  const now = React.useMemo(() => new Date(), []);
  const isCurrentYear = year === now.getFullYear();

  // Month is client-only state - calendar swap doesn't need server refetch.
  const [month, setMonth] = React.useState(
    isCurrentYear ? now.getMonth() : 0,
  );
  const [thisWeek, setThisWeek] = React.useState(false);

  // O(1) lookups in the calendar.
  const trainedSet = React.useMemo(
    () => new Set(trainedDates),
    [trainedDates],
  );

  // When "Esta semana" is on, force the calendar to the month that contains
  // today so the highlighted band is visible.
  React.useEffect(() => {
    if (!thisWeek) return;
    if (year !== now.getFullYear()) return;
    setMonth(now.getMonth());
  }, [thisWeek, year, now]);

  // Year change → reload server payload (re-renders with new year's data).
  function changeYear(next: number) {
    if (next === year) return;
    router.push(`/evolucao?year=${next}`, { scroll: false });
  }

  const currentYear = now.getFullYear();
  const yearOptions: number[] = [];
  for (let y = currentYear; y >= firstYearWithData; y--) yearOptions.push(y);
  // Always include the current year (covers the no-data case).
  if (!yearOptions.includes(currentYear)) yearOptions.unshift(currentYear);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Three selectors: Year · Month · "Esta semana" ── */}
      <section className="flex flex-wrap items-center gap-2">
        <div className="flex flex-col">
          <label
            htmlFor="evolucao-year"
            className="sr-only"
          >
            Ano
          </label>
          <select
            id="evolucao-year"
            value={year}
            onChange={(e) => changeYear(Number(e.target.value))}
            className="h-11 rounded-pill bg-bg-surface border border-border-subtle text-body text-text-primary font-semibold pl-4 pr-9 appearance-none focus:outline-none focus:border-accent transition-colors"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a8a8a8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 14px center",
              backgroundSize: "12px",
            }}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="evolucao-month" className="sr-only">
            Mês
          </label>
          <select
            id="evolucao-month"
            value={month}
            onChange={(e) => {
              setMonth(Number(e.target.value));
              setThisWeek(false);
            }}
            className="h-11 rounded-pill bg-bg-surface border border-border-subtle text-body text-text-primary font-semibold pl-4 pr-9 appearance-none focus:outline-none focus:border-accent transition-colors"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a8a8a8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 14px center",
              backgroundSize: "12px",
            }}
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setThisWeek((v) => !v)}
          className={cn(
            "h-11 px-5 rounded-pill border text-body font-semibold transition-colors",
            thisWeek
              ? "bg-accent text-text-on-accent border-accent shadow-accent"
              : "bg-bg-surface text-text-secondary border-border-subtle hover:text-text-primary hover:bg-bg-elevated",
          )}
        >
          Esta semana
        </button>
      </section>

      {/* ── Frequency line chart ── */}
      <HeroCard className="p-5">
        <EvolucaoFrequencyChart
          monthlyCounts={monthlyCounts}
          selectedMonth={month}
          year={year}
        />
      </HeroCard>

      {/* ── Month calendar ── */}
      <HeroCard className="p-5">
        <EvolucaoCalendar
          year={year}
          month={month}
          trainedDates={trainedSet}
          thisWeekOnly={thisWeek && year === currentYear}
        />
      </HeroCard>
    </div>
  );
}
