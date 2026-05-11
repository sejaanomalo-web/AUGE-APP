import { Activity, Calendar, Flame, Scale, Sparkles, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/shared/StatCard";
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
  const totalMonthVolume = volumeData.slice(-4).reduce((a, p) => a + p.value, 0);
  const currentWeight = weightData.at(-1)?.value ?? null;
  const firstWeight = weightData[0]?.value ?? null;

  if (weightData.length === 0 && volumeData.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Evolução" subtitle="O que mudou nas últimas semanas" />
        <EmptyState
          icon={TrendingUp}
          title="Dados insuficientes"
          description="Finalize alguns treinos e registre medidas para ver seu progresso aqui."
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Evolução" subtitle="O que mudou nas últimas semanas" />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Volume (último mês)"
          value={
            totalMonthVolume > 0
              ? `${totalMonthVolume.toLocaleString("pt-BR")} kg`
              : "—"
          }
          icon={TrendingUp}
        />
        <StatCard
          label="Frequência"
          value={`${stats.completedWorkouts}/sem`}
          icon={Calendar}
        />
        <StatCard
          label="Streak"
          value={`${stats.streakDays} dias`}
          icon={Flame}
        />
        <StatCard
          label="Peso atual"
          value={currentWeight ? `${currentWeight.toFixed(1)} kg` : "—"}
          delta={
            currentWeight && firstWeight
              ? {
                  value: `${(currentWeight - firstWeight).toFixed(1)} kg`,
                  positive: currentWeight <= firstWeight,
                }
              : undefined
          }
          hint={weightData.length > 1 ? `vs ${weightData.length} sem` : undefined}
          icon={Scale}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {weightData.length >= 2 && (
          <Card variant="default">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-h3 text-text-primary">Peso corporal</h2>
              <Badge>{weightData.length} pontos</Badge>
            </div>
            <EvolutionChart data={weightData} unit="kg" variant="line" />
          </Card>
        )}

        {volumeData.length >= 2 && (
          <Card variant="default">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-h3 text-text-primary">Volume semanal</h2>
              <Badge>{volumeData.length} semanas</Badge>
            </div>
            <EvolutionChart data={volumeData} unit="kg" variant="bar" />
          </Card>
        )}
      </section>

      {evolution.totalWorkouts > 4 && (
        <Card variant="elevated" className="border border-accent/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-glow flex items-center justify-center shrink-0">
              <Sparkles size={20} className="text-accent" aria-hidden />
            </div>
            <div className="flex-1">
              <Badge>Análise inteligente</Badge>
              <h2 className="mt-2 text-h2 text-text-primary">
                Resumo da jornada
              </h2>
              <p className="mt-2 text-body-lg text-text-secondary">
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
        </Card>
      )}

      {evolution.totalWorkouts === 0 && weightData.length > 0 && (
        <EmptyState
          icon={Activity}
          title="Sem treinos completos ainda"
          description="Finalize alguns treinos para ver a evolução do seu volume aqui."
        />
      )}
    </div>
  );
}
