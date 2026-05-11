import { Sparkles, Calendar, Flame, TrendingUp, Scale } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/shared/StatCard";
import { EvolutionChart } from "@/components/aluno/EvolutionChart";
import {
  alunoStats,
  bodyMetrics,
  getWeeklyAnalysis,
  getWeeklyVolume,
} from "@/lib/mock-data";
import { formatShortDate } from "@/lib/date";

export default function EvolucaoPage() {
  const weight = bodyMetrics.map((m) => ({
    label: formatShortDate(m.date),
    value: m.weightKg,
  }));
  const volume = getWeeklyVolume().map((w) => ({
    label: formatShortDate(w.week),
    value: w.volumeKg,
  }));
  const currentWeight = bodyMetrics.at(-1)?.weightKg ?? 0;
  const firstWeight = bodyMetrics[0]?.weightKg ?? currentWeight;
  const totalMonthVolume = volume.slice(-4).reduce((a, p) => a + p.value, 0);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Evolução"
        subtitle="O que mudou nas últimas 12 semanas"
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Volume (último mês)"
          value={`${totalMonthVolume.toLocaleString("pt-BR")} kg`}
          icon={TrendingUp}
        />
        <StatCard
          label="Frequência"
          value={`${alunoStats.treinosCompletosSemana}/sem`}
          icon={Calendar}
        />
        <StatCard
          label="Streak"
          value={`${alunoStats.streakDias} dias`}
          icon={Flame}
        />
        <StatCard
          label="Peso atual"
          value={`${currentWeight.toFixed(1)} kg`}
          delta={{
            value: `${(currentWeight - firstWeight).toFixed(1)} kg`,
            positive: currentWeight <= firstWeight,
          }}
          hint="vs 12 sem"
          icon={Scale}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <Card variant="default">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-h3 text-text-primary">Peso corporal</h2>
            <Badge>12 semanas</Badge>
          </div>
          <EvolutionChart data={weight} unit="kg" variant="line" />
        </Card>

        <Card variant="default">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-h3 text-text-primary">Volume semanal</h2>
            <Badge>8 semanas</Badge>
          </div>
          <EvolutionChart data={volume} unit="kg" variant="bar" />
        </Card>
      </section>

      <Card variant="elevated" className="border border-accent/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-glow flex items-center justify-center shrink-0">
            <Sparkles size={20} className="text-accent" aria-hidden />
          </div>
          <div className="flex-1">
            <Badge>Análise inteligente</Badge>
            <h2 className="mt-2 text-h2 text-text-primary">Análise da semana</h2>
            <p className="mt-2 text-body-lg text-text-secondary">
              {getWeeklyAnalysis()}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
