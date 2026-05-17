"use client";

import * as React from "react";
import { History } from "lucide-react";
import { WorkoutCard } from "./WorkoutCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { HeroCard } from "@/components/visual/HeroCard";
import { StatHero } from "@/components/visual/StatHero";
import { WorkoutBarChart } from "@/components/visual/WorkoutBarChart";
import {
  MonthYearFilter,
  type MonthYearValue,
} from "@/components/shared/MonthYearFilter";
import { differenceInCalendarDays, parseISO } from "date-fns";
import type { WorkoutStatus } from "@/components/shared/StatusBadge";

export interface HistoricoLog {
  id: string;
  dateIso: string;
  sessionLetter: string;
  sessionName: string;
  status: WorkoutStatus;
  durationSeconds?: number;
  totalVolumeKg?: number;
}

function groupKey(dateIso: string): string {
  const date = parseISO(dateIso);
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const dateKey = date.toISOString().slice(0, 10);
  if (dateKey === todayKey) return "Hoje";
  const days = differenceInCalendarDays(today, date);
  if (days === 1) return "Ontem";
  if (days < 7) return "Esta semana";
  if (days < 14) return "Semana passada";
  if (days < 30) return "Este mês";
  return "Mais antigos";
}

const GROUP_ORDER = [
  "Hoje",
  "Ontem",
  "Esta semana",
  "Semana passada",
  "Este mês",
  "Mais antigos",
];

export function HistoricoClient({ logs }: { logs: HistoricoLog[] }) {
  const [filter, setFilter] = React.useState<MonthYearValue>({
    year: null,
    month: null,
  });

  const years = React.useMemo(() => {
    const set = new Set<number>();
    logs.forEach((l) => set.add(parseISO(l.dateIso).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [logs]);

  const filtered = React.useMemo(
    () =>
      logs.filter((l) => {
        const d = parseISO(l.dateIso);
        if (filter.year !== null && d.getFullYear() !== filter.year)
          return false;
        if (filter.month !== null && d.getMonth() !== filter.month)
          return false;
        return true;
      }),
    [logs, filter],
  );

  // Stats reflect the active filter - counted only on COMPLETED logs so
  // numbers stay meaningful (incomplete sessions don't pollute totals).
  const stats = React.useMemo(() => {
    const completed = filtered.filter((l) => l.status === "concluido");
    const totalVolume = completed.reduce(
      (a, l) => a + (l.totalVolumeKg ?? 0),
      0,
    );
    const totalSeconds = completed.reduce(
      (a, l) => a + (l.durationSeconds ?? 0),
      0,
    );
    const avgMinutes = completed.length
      ? Math.round(totalSeconds / 60 / completed.length)
      : 0;
    return {
      count: completed.length,
      totalVolume,
      avgMinutes,
      chartData: completed.map((l) => ({ date: parseISO(l.dateIso) })),
    };
  }, [filtered]);

  const grouped = new Map<string, HistoricoLog[]>();
  for (const l of filtered) {
    const k = groupKey(l.dateIso);
    grouped.set(k, [...(grouped.get(k) ?? []), l]);
  }
  const sortedGroups = GROUP_ORDER.filter((g) => grouped.has(g)).map(
    (g) => [g, grouped.get(g)!] as const,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Filter - pinned to the top so stats + chart + list all react to it */}
      {logs.length > 0 && (
        <div className="flex justify-start">
          <MonthYearFilter
            value={filter}
            onChange={setFilter}
            availableYears={years}
          />
        </div>
      )}

      {/* Period stats - synced with the filter */}
      {logs.length > 0 && (
        <section className="grid grid-cols-3 gap-3">
          <HeroCard className="p-4">
            <StatHero value={stats.count} label="Treinos" size="sm" />
          </HeroCard>
          <HeroCard className="p-4">
            <StatHero
              value={
                stats.totalVolume > 0
                  ? `${(stats.totalVolume / 1000).toFixed(0)}k`
                  : "-"
              }
              label="kg totais"
              size="sm"
            />
          </HeroCard>
          <HeroCard className="p-4">
            <StatHero
              value={stats.avgMinutes > 0 ? `${stats.avgMinutes}` : "-"}
              label="min médios"
              size="sm"
            />
          </HeroCard>
        </section>
      )}

      {/* Self-explanatory bar chart (treinos por semana/mês) */}
      {stats.chartData.length > 0 && (
        <HeroCard className="p-5">
          <WorkoutBarChart workouts={stats.chartData} />
        </HeroCard>
      )}

      {logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nenhum treino registrado"
          description="Seu histórico vai aparecer aqui assim que você finalizar seu primeiro treino."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nenhum treino no período"
          description="Ajuste os filtros ou volte para ver todo o histórico."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {sortedGroups.map(([group, items]) => (
            <section key={group}>
              <h2 className="text-caption uppercase tracking-normal text-text-muted mb-3">
                {group}
              </h2>
              <div className="flex flex-col gap-2">
                {items.map((l) => (
                  <WorkoutCard
                    key={l.id}
                    log={{
                      id: l.id,
                      date: l.dateIso.slice(0, 10),
                      sessionLetter: l.sessionLetter,
                      sessionName: l.sessionName,
                      status: l.status,
                      durationSeconds: l.durationSeconds,
                      totalVolumeKg: l.totalVolumeKg,
                    }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
