import { PageHeader } from "@/components/shared/PageHeader";
import { WorkoutCard } from "@/components/aluno/WorkoutCard";
import { workoutLogs, TODAY_ISO } from "@/lib/mock-data";
import { formatLongDate } from "@/lib/date";
import { parseISO, differenceInDays } from "date-fns";
import { EmptyState } from "@/components/shared/EmptyState";
import { History } from "lucide-react";

function groupKey(date: string) {
  const days = differenceInDays(parseISO(TODAY_ISO), parseISO(date));
  if (days < 7) return "Esta semana";
  if (days < 14) return "Semana passada";
  if (days < 30) return "Este mês";
  return "Mais antigos";
}

export default function HistoricoPage() {
  // Most-recent first
  const logs = [...workoutLogs].sort((a, b) => b.date.localeCompare(a.date));
  const grouped = new Map<string, typeof logs>();
  for (const l of logs) {
    const k = groupKey(l.date);
    grouped.set(k, [...(grouped.get(k) ?? []), l]);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Histórico de treinos"
        subtitle={`Última atualização em ${formatLongDate(TODAY_ISO)}`}
      />

      {logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nenhum treino registrado"
          description="Seu histórico vai aparecer aqui assim que você começar a treinar."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {Array.from(grouped.entries()).map(([group, items]) => (
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
                      date: l.date,
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
