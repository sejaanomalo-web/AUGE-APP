import { Activity, Trophy, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/Card";
import { HeroCard } from "@/components/visual/HeroCard";
import { StatHero } from "@/components/visual/StatHero";
import { WorkoutBarChart } from "@/components/visual/WorkoutBarChart";
import { EmptyState } from "@/components/shared/EmptyState";
import { EvolutionChart } from "@/components/aluno/EvolutionChart";
import { requireRole } from "@/lib/auth-helpers";
import { getMyEvolution } from "@/lib/actions/evolution";
import { getAlunoWeeklyStats } from "@/lib/aluno-stats";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatShortDate } from "@/lib/date";

export default async function EvolucaoPage() {
  const user = await requireRole("ALUNO");
  const [evolution, stats] = await Promise.all([
    getMyEvolution(),
    getAlunoWeeklyStats(user.id),
  ]);

  // Body weight series — last 12 entries, oldest → newest.
  const weightSeries = evolution.metrics
    .filter((m) => m.weight != null)
    .slice(-12)
    .map((m) => ({
      label: formatShortDate(m.date.toISOString().slice(0, 10)),
      value: m.weight!,
    }));
  const currentWeight = weightSeries.at(-1)?.value ?? null;
  const firstWeight = weightSeries[0]?.value ?? null;
  const weightDelta =
    currentWeight !== null && firstWeight !== null
      ? currentWeight - firstWeight
      : 0;
  const weightDeltaPct =
    currentWeight !== null && firstWeight !== null && firstWeight > 0
      ? Math.round((Math.abs(weightDelta) / firstWeight) * 100)
      : 0;

  // Volume per week (last 8 weeks) — for the volume bar chart.
  const volumeSeries = evolution.weeklyVolume.slice(-8).map((w) => ({
    label: formatShortDate(w.week),
    value: Math.round(w.volume),
  }));

  // Workouts per month — feed WorkoutBarChart by exploding the count back
  // into individual date entries (the chart auto-buckets by month).
  const monthlyChartData = evolution.monthlyCounts.flatMap((m) =>
    Array.from({ length: m.count }, () => ({ date: parseISO(`${m.month}-15`) })),
  );

  const hasAnyData =
    evolution.totalWorkouts > 0 || weightSeries.length > 0;

  if (!hasAnyData) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title="Evolução"
          subtitle="Seu progresso compilado em um painel."
        />
        <EmptyState
          icon={TrendingUp}
          title="Dados insuficientes"
          description="Finalize alguns treinos e registre medidas para ver seu progresso aqui."
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <PageHeader
        title="Evolução"
        subtitle="Seu progresso compilado em um painel."
      />

      {/* ───────── Hero stat row — 4 numbers, equal weight ───────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HeroCard className="p-5">
          <StatHero
            value={evolution.monthCount}
            label="Treinos no mês"
            size="sm"
          />
        </HeroCard>
        <HeroCard className="p-5">
          <StatHero
            value={evolution.totalWorkouts}
            label="Treinos no ano"
            size="sm"
          />
        </HeroCard>
        <HeroCard className="p-5">
          <StatHero
            value={
              evolution.totalVolume > 0
                ? `${(evolution.totalVolume / 1000).toFixed(1)}k`
                : "—"
            }
            label="Volume total (kg)"
            size="sm"
          />
        </HeroCard>
        <HeroCard className="p-5" bare={stats.streakDays === 0}>
          <StatHero
            value={
              <span className="inline-flex items-center gap-2">
                {stats.streakDays}
                {stats.streakDays > 0 && (
                  <Activity
                    size={24}
                    strokeWidth={2.5}
                    className="text-accent"
                    aria-hidden
                  />
                )}
              </span>
            }
            label="Dias seguidos"
            size="sm"
          />
        </HeroCard>
      </section>

      {/* ───────── Workouts per month ───────── */}
      {monthlyChartData.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-4 gap-3">
            <h2 className="text-h2 text-text-primary">Frequência</h2>
            <p className="text-caption text-text-muted">
              treinos por mês · últimos 12 meses
            </p>
          </div>
          <HeroCard className="p-5">
            <WorkoutBarChart workouts={monthlyChartData} />
          </HeroCard>
        </section>
      )}

      {/* ───────── Body weight + Volume ───────── */}
      {(weightSeries.length >= 2 || volumeSeries.length >= 2) && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {weightSeries.length >= 2 && (
            <HeroCard className="p-5 flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-stat-label uppercase text-text-muted">
                    Peso corporal
                  </p>
                  <p className="mt-1 text-stat-medium text-text-primary font-mono-num">
                    {currentWeight?.toFixed(1)}
                    <span className="text-h2 text-text-muted ml-1">kg</span>
                  </p>
                </div>
                {weightDelta !== 0 && (
                  <span
                    className={`text-caption font-bold inline-flex items-center gap-1 ${
                      weightDelta < 0 ? "text-success" : "text-warning"
                    }`}
                  >
                    {weightDelta < 0 ? "↓" : "↑"}
                    {weightDeltaPct}% · {Math.abs(weightDelta).toFixed(1)} kg
                  </span>
                )}
              </div>
              <EvolutionChart data={weightSeries} unit="kg" variant="line" />
            </HeroCard>
          )}

          {volumeSeries.length >= 2 && (
            <HeroCard className="p-5 flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-stat-label uppercase text-text-muted">
                    Volume semanal
                  </p>
                  <p className="mt-1 text-stat-medium text-text-primary font-mono-num">
                    {(
                      volumeSeries.reduce((a, p) => a + p.value, 0) / 1000
                    ).toFixed(1)}
                    k
                    <span className="text-h2 text-text-muted ml-1">kg</span>
                  </p>
                </div>
                <span className="text-caption text-text-muted">
                  últimas {volumeSeries.length} sem
                </span>
              </div>
              <EvolutionChart data={volumeSeries} unit="kg" variant="bar" />
            </HeroCard>
          )}
        </section>
      )}

      {/* ───────── Top PRs leaderboard ───────── */}
      {evolution.topPRs.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-4 gap-3">
            <h2 className="text-h2 text-text-primary">Recordes pessoais</h2>
            <p className="text-caption text-text-muted">maior peso por exercício</p>
          </div>
          <HeroCard className="p-2 sm:p-3">
            <ul className="flex flex-col">
              {evolution.topPRs.map((pr, idx) => (
                <li
                  key={`${pr.name}-${idx}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-elevated/40 transition-colors"
                >
                  <div
                    className={
                      idx === 0
                        ? "shrink-0 w-9 h-9 rounded-full bg-accent text-text-on-accent inline-flex items-center justify-center font-bold tnum"
                        : "shrink-0 w-9 h-9 rounded-full bg-bg-elevated text-text-muted inline-flex items-center justify-center font-bold tnum"
                    }
                  >
                    {idx === 0 ? (
                      <Trophy size={16} aria-hidden />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body text-text-primary font-semibold truncate">
                      {pr.name}
                    </p>
                    <p className="text-caption text-text-muted">
                      {format(parseISO(pr.dateIso), "dd 'de' MMM", {
                        locale: ptBR,
                      })}{" "}
                      · {pr.reps} reps
                    </p>
                  </div>
                  <p className="text-h3 text-text-primary font-mono-num tnum shrink-0">
                    {pr.weight} <span className="text-text-muted">kg</span>
                  </p>
                </li>
              ))}
            </ul>
          </HeroCard>
        </section>
      )}

      {/* ───────── Closing insight ───────── */}
      {evolution.totalWorkouts >= 4 && (
        <HeroCard intensity="medium" className="p-5">
          <p className="text-stat-label uppercase text-accent">
            Resumo da jornada
          </p>
          <p className="mt-2 text-body-lg text-text-secondary leading-relaxed">
            Você completou{" "}
            <strong className="text-text-primary">
              {evolution.totalWorkouts} treinos
            </strong>{" "}
            no último ano — média de{" "}
            <strong className="text-text-primary">
              {evolution.avgPerWeek.toFixed(1)} por semana
            </strong>{" "}
            no último trimestre. Tempo médio por sessão:{" "}
            <strong className="text-text-primary">
              {evolution.avgMinutesAll} min
            </strong>
            .
          </p>
        </HeroCard>
      )}

      {evolution.totalWorkouts === 0 && weightSeries.length > 0 && (
        <Card variant="default">
          <EmptyState
            icon={Activity}
            title="Sem treinos completos ainda"
            description="Finalize alguns treinos para ver a evolução do seu volume aqui."
          />
        </Card>
      )}
    </div>
  );
}
