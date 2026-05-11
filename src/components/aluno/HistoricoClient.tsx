"use client";

import * as React from "react";
import { History } from "lucide-react";
import { WorkoutCard } from "./WorkoutCard";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  MonthYearFilter,
  type MonthYearValue,
} from "@/components/shared/MonthYearFilter";
import { differenceInCalendarDays, parseISO } from "date-fns";
import type { WorkoutStatus } from "@/components/shared/StatusBadge";

export interface HistoricoLog {
  id: string;
  dateIso: string; // full ISO with time
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

  const filtered = logs.filter((l) => {
    const d = parseISO(l.dateIso);
    if (filter.year !== null && d.getFullYear() !== filter.year) return false;
    if (filter.month !== null && d.getMonth() !== filter.month) return false;
    return true;
  });

  const grouped = new Map<string, HistoricoLog[]>();
  for (const l of filtered) {
    const k = groupKey(l.dateIso);
    grouped.set(k, [...(grouped.get(k) ?? []), l]);
  }
  const sortedGroups = GROUP_ORDER.filter((g) => grouped.has(g)).map(
    (g) => [g, grouped.get(g)!] as const,
  );

  return (
    <>
      {logs.length > 0 && (
        <div className="flex justify-end mb-4">
          <MonthYearFilter
            value={filter}
            onChange={setFilter}
            availableYears={years}
          />
        </div>
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
              <h2 className="text-caption uppercase tracking-[0.08em] text-text-muted mb-3">
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
    </>
  );
}
