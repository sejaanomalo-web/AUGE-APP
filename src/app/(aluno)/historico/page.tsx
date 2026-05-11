import { History } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { WorkoutCard } from "@/components/aluno/WorkoutCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { requireRole } from "@/lib/auth-helpers";
import { getMyHistory } from "@/lib/actions/workout-logs";
import { parseISO, differenceInDays } from "date-fns";

function groupKey(date: Date) {
  const days = differenceInDays(new Date(), date);
  if (days < 7) return "Esta semana";
  if (days < 14) return "Semana passada";
  if (days < 30) return "Este mês";
  return "Mais antigos";
}

export default async function HistoricoPage() {
  await requireRole("ALUNO");
  const logs = await getMyHistory(60);

  const grouped = new Map<string, typeof logs>();
  for (const l of logs) {
    const k = groupKey(l.startedAt);
    grouped.set(k, [...(grouped.get(k) ?? []), l]);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Histórico de treinos"
        subtitle="Tudo que você já registrou"
      />

      {logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nenhum treino registrado"
          description="Seu histórico vai aparecer aqui assim que você finalizar seu primeiro treino."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {Array.from(grouped.entries()).map(([group, items]) => (
            <section key={group}>
              <h2 className="text-caption uppercase tracking-[0.08em] text-text-muted mb-3">
                {group}
              </h2>
              <div className="flex flex-col gap-2">
                {items.map((l) => {
                  // compute total volume + duration
                  const totalVolumeKg = l.exerciseLogs.reduce(
                    (acc, el) =>
                      acc +
                      (el.completed && el.weight && el.reps
                        ? el.weight * el.reps
                        : 0),
                    0,
                  );
                  const durationSeconds =
                    l.finishedAt
                      ? Math.round(
                          (l.finishedAt.getTime() - l.startedAt.getTime()) /
                            1000,
                        )
                      : undefined;

                  return (
                    <WorkoutCard
                      key={l.id}
                      log={{
                        id: l.id,
                        date: l.startedAt.toISOString().slice(0, 10),
                        sessionLetter: l.session.name.charAt(0) || "T",
                        sessionName: l.session.name,
                        status:
                          l.status === "COMPLETED"
                            ? "concluido"
                            : l.status === "ABANDONED"
                              ? "pulado"
                              : "em_andamento",
                        durationSeconds,
                        totalVolumeKg: Math.round(totalVolumeKg),
                      }}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
