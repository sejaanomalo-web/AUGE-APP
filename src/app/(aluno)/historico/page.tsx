import { PageHeader } from "@/components/shared/PageHeader";
import { HistoricoClient } from "@/components/aluno/HistoricoClient";
import { HeroCard } from "@/components/visual/HeroCard";
import { StatHero } from "@/components/visual/StatHero";
import { FrequencyHeatmap } from "@/components/visual/FrequencyHeatmap";
import { requireRole } from "@/lib/auth-helpers";
import { getMyHistory } from "@/lib/actions/workout-logs";
import type { WorkoutStatus } from "@/components/shared/StatusBadge";

export default async function HistoricoPage() {
  await requireRole("ALUNO");
  const raw = await getMyHistory(120);

  const logs = raw.map((l) => {
    const totalVolumeKg = Math.round(
      l.exerciseLogs.reduce(
        (acc, el) =>
          acc +
          (el.completed && el.weight && el.reps ? el.weight * el.reps : 0),
        0,
      ),
    );
    const durationSeconds = l.finishedAt
      ? Math.round((l.finishedAt.getTime() - l.startedAt.getTime()) / 1000)
      : undefined;
    const status: WorkoutStatus =
      l.status === "COMPLETED"
        ? "concluido"
        : l.status === "ABANDONED"
          ? "pulado"
          : "em_andamento";
    return {
      id: l.id,
      dateIso: l.startedAt.toISOString(),
      sessionLetter: l.session.name.charAt(0) || "T",
      sessionName: l.session.name,
      status,
      durationSeconds,
      totalVolumeKg,
    };
  });

  // Aggregated stats (completed only)
  const completed = logs.filter((l) => l.status === "concluido");
  const totalVolume = completed.reduce((a, l) => a + (l.totalVolumeKg ?? 0), 0);
  const totalMinutes = completed.reduce(
    (a, l) => a + (l.durationSeconds ? l.durationSeconds / 60 : 0),
    0,
  );
  const avgMinutes = completed.length
    ? Math.round(totalMinutes / completed.length)
    : 0;

  // 30-day heatmap input from completed logs
  const dailyWorkouts = completed.map((l) => ({
    date: new Date(l.dateIso),
    volume: l.totalVolumeKg ?? 0,
  }));

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Histórico de treinos"
        subtitle="Tudo que você já registrou"
      />

      {/* Aggregated stats */}
      {completed.length > 0 && (
        <section className="grid grid-cols-3 gap-3">
          <HeroCard className="p-4">
            <StatHero
              value={completed.length}
              label="Treinos"
              size="sm"
            />
          </HeroCard>
          <HeroCard className="p-4">
            <StatHero
              value={
                totalVolume > 0
                  ? `${(totalVolume / 1000).toFixed(0)}k`
                  : "—"
              }
              label="kg totais"
              size="sm"
            />
          </HeroCard>
          <HeroCard className="p-4">
            <StatHero
              value={avgMinutes > 0 ? `${avgMinutes}` : "—"}
              label="min médios"
              size="sm"
            />
          </HeroCard>
        </section>
      )}

      {/* Mini heatmap — last 30 days */}
      {completed.length > 0 && (
        <HeroCard className="p-4">
          <FrequencyHeatmap workouts={dailyWorkouts} days={30} />
        </HeroCard>
      )}

      <HistoricoClient logs={logs} />
    </div>
  );
}
