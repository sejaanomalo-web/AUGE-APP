import { Activity, Sparkles, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { HeroCard } from "@/components/visual/HeroCard";
import { StatHero } from "@/components/visual/StatHero";
import { FrequencyHeatmap } from "@/components/visual/FrequencyHeatmap";
import { EmptyState } from "@/components/shared/EmptyState";
import { EvolutionChart } from "@/components/aluno/EvolutionChart";
import { requireRole } from "@/lib/auth-helpers";
import { getMyEvolution } from "@/lib/actions/evolution";
import { getAlunoWeeklyStats } from "@/lib/aluno-stats";
import { formatShortDate } from "@/lib/date";

export default async function EvolucaoPage() {
  const user = await requireRole("ALUNO");
  const [evolution, stats] = await Promise.all([
    getMyEvolution(),
    getAlunoWeeklyStats(user.id),
  ]);

  const weightData = evolution.metrics
    .filter((m) => m.weight != null)
    .map((m) => ({
      label: formatShortDate(m.date.toISOString().slice(0, 10)),
      value: m.weight!,
    }));
  const volumeData = evolution.weeklyVolume.slice(-8).map((w) => ({
    label: formatShortDate(w.week),
    value: Math.round(w.volume),
  }));
  const totalMonthVolume = volumeData
    .slice(-4)
    .reduce((a, p) => a + p.value, 0);
  const currentWeight = weightData.at(-1)?.value ?? null;
  const firstWeight = weightData[0]?.value ?? null;
  const weightDelta =
    currentWeight && firstWeight ? currentWeight - firstWeight : 0;
  const weightDeltaPct =
    currentWeight && firstWeight
      ? Math.round((Math.abs(weightDelta) / firstWeight) * 100)
      : 0;

  if (weightData.length === 0 && volumeData.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title="Evolução"
          subtitle="O que mudou nas últimas semanas"
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
        subtitle="O que mudou nas últimas semanas"
      />

      {/* Hero stat: volume do último mês */}
      {totalMonthVolume > 0 && (
        <HeroCard intensity="medium" className="p-6 sm:p-8">
          <StatHero
            label="Volume · último mês"
            value={
              <span>
                {(totalMonthVolume / 1000).toFixed(1)}
                <span className="text-stat-medium text-text-muted ml-2 not-italic">
                  k kg
                </span>
              </span>
            }
            size="lg"
          />
        </HeroCard>
      )}

      {/* Stats row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HeroCard className="p-5">
          <StatHero
            value={`${stats.completedWorkouts}`}
            label="Treinos / semana"
            size="sm"
          />
        </HeroCard>
        <HeroCard className="p-5" bare={stats.streakDays === 0}>
          <StatHero
            value={
              <span className="inline-flex items-center gap-1.5">
                {stats.streakDays}
                {stats.streakDays > 0 && (
                  <span className="text-stat-medium not-italic">🔥</span>
                )}
              </span>
            }
            label="Streak"
            size="sm"
          />
        </HeroCard>
        <HeroCard className="p-5">
          <StatHero
            value={
              currentWeight ? `${currentWeight.toFixed(1)}` : "—"
            }
            label={currentWeight ? "kg atual" : "Peso atual"}
            size="sm"
            variation={
              currentWeight && firstWeight && weightDelta !== 0
                ? {
                    value: weightDeltaPct,
                    type: weightDelta < 0 ? "positive" : "negative",
                  }
                : undefined
            }
          />
        </HeroCard>
        <HeroCard className="p-5">
          <StatHero
            value={`${evolution.avgPerWeek.toFixed(1)}x`}
            label="Média trimestral"
            size="sm"
          />
        </HeroCard>
      </section>

      {/* Frequency heatmap (90 dias) */}
      {evolution.totalWorkouts > 0 && (
        <section>
          <h2 className="text-h2 text-text-primary mb-4">
            Frequência · últimos 90 dias
          </h2>
          <HeroCard className="p-5">
            <FrequencyHeatmap workouts={evolution.dailyWorkouts} days={90} />
          </HeroCard>
        </section>
      )}

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {weightData.length >= 2 && (
          <HeroCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-h3 text-text-primary">Peso corporal</h2>
              <Badge>{weightData.length} pontos</Badge>
            </div>
            <EvolutionChart data={weightData} unit="kg" variant="line" />
          </HeroCard>
        )}

        {volumeData.length >= 2 && (
          <HeroCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-h3 text-text-primary">Volume semanal</h2>
              <Badge>{volumeData.length} semanas</Badge>
            </div>
            <EvolutionChart data={volumeData} unit="kg" variant="bar" />
          </HeroCard>
        )}
      </section>

      {/* IA insight */}
      {evolution.totalWorkouts > 4 && (
        <HeroCard intensity="medium" className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-glow flex items-center justify-center shrink-0">
              <Sparkles size={20} className="text-accent" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-stat-label uppercase text-accent">
                ✨ Análise inteligente
              </p>
              <h2 className="mt-2 text-h2 text-text-primary">
                Resumo da jornada
              </h2>
              <p className="mt-2 text-body-lg text-text-secondary leading-relaxed">
                Você completou{" "}
                <strong className="text-text-primary">
                  {evolution.totalWorkouts} treinos
                </strong>{" "}
                nos últimos 90 dias — média de{" "}
                <strong className="text-text-primary">
                  {evolution.avgPerWeek.toFixed(1)} por semana
                </strong>
                . Mantenha a frequência para evoluir.
              </p>
            </div>
          </div>
        </HeroCard>
      )}

      {evolution.totalWorkouts === 0 && weightData.length > 0 && (
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
