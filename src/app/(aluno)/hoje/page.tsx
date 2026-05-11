import Link from "next/link";
import { Clock, Dumbbell, Flame, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/LinkButton";
import { Progress } from "@/components/ui/Progress";
import { StatCard } from "@/components/shared/StatCard";
import { WeightSparkline } from "@/components/aluno/WeightSparkline";
import { capitalize, formatDayMonth } from "@/lib/date";
import {
  TODAY_ISO,
  activePlan,
  alunoStats,
  aluno,
  bodyMetrics,
  getActiveSessionForToday,
  todayLog,
  upcomingSessions,
} from "@/lib/mock-data";

export default function HojePage() {
  const session = getActiveSessionForToday();
  const isRest = !session;
  const alreadyDone = todayLog?.status === "concluido";
  const inProgress = todayLog?.status === "em_andamento";

  const last4WeeksWeight = bodyMetrics.slice(-4).map((m) => ({
    date: m.date,
    weightKg: m.weightKg,
  }));
  const currentWeight = last4WeeksWeight.at(-1)?.weightKg ?? 0;
  const firstWeight = last4WeeksWeight[0]?.weightKg ?? currentWeight;
  const weightDelta = +(currentWeight - firstWeight).toFixed(1);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Saudação */}
      <section>
        <h1 className="text-h1 text-text-primary">
          Olá, {aluno.name.split(" ")[0]} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1 text-body-lg text-text-secondary">
          {capitalize(formatDayMonth(TODAY_ISO))}
        </p>
      </section>

      {/* Card Highlight — Treino do Dia */}
      {isRest ? (
        <Card variant="default">
          <div className="flex flex-col gap-2">
            <Badge>Descanso</Badge>
            <h2 className="text-h2 text-text-primary">
              Hoje é dia de descanso
            </h2>
            <p className="text-body text-text-secondary">
              Aproveite para hidratar bem e dormir cedo. Amanhã tem treino.
            </p>
          </div>
        </Card>
      ) : (
        <Card variant="highlight" className="flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge>Treino {session.letter}</Badge>
            {inProgress && <Badge variant="in_progress">Em andamento</Badge>}
            {alreadyDone && <Badge variant="concluido">Concluído</Badge>}
          </div>
          <h2 className="text-h2 text-text-primary">{session.name}</h2>
          <p className="text-body text-text-secondary">
            {session.exercises.length} exercícios · ~{session.estimatedMinutes}{" "}
            min · {activePlan.weeklyFrequency}x semana
          </p>

          <div className="mt-1">
            <div className="flex items-center justify-between text-caption text-text-secondary mb-1.5">
              <span>Esta semana</span>
              <span className="tnum">
                {alunoStats.treinosCompletosSemana} de{" "}
                {alunoStats.treinosPrescritosSemana} treinos
              </span>
            </div>
            <Progress
              value={alunoStats.treinosCompletosSemana}
              max={alunoStats.treinosPrescritosSemana}
            />
          </div>

          {alreadyDone ? (
            <div className="mt-1 flex items-center gap-3 flex-wrap">
              <LinkButton
                variant="tertiary"
                size="md"
                href={`/historico/${todayLog?.id}`}
              >
                Ver detalhes →
              </LinkButton>
            </div>
          ) : inProgress && todayLog ? (
            <LinkButton
              variant="primary"
              size="cta"
              fullWidth
              href={`/treino/${session.id}/executar`}
            >
              Retomar treino
            </LinkButton>
          ) : (
            <LinkButton
              variant="primary"
              size="cta"
              fullWidth
              href={`/treino/${session.id}`}
            >
              Iniciar treino
            </LinkButton>
          )}
        </Card>
      )}

      {/* Stats Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Treinos da semana"
          value={`${alunoStats.treinosCompletosSemana}/${alunoStats.treinosPrescritosSemana}`}
          hint={
            <Progress
              value={alunoStats.treinosCompletosSemana}
              max={alunoStats.treinosPrescritosSemana}
              thin
              className="mt-1"
            />
          }
          icon={Dumbbell}
        />
        <StatCard
          label="Streak atual"
          value={
            <span className="inline-flex items-center gap-1.5">
              {alunoStats.streakDias} dias{" "}
              <Flame size={20} className="text-warning" aria-hidden />
            </span>
          }
          icon={Flame}
        />
        <StatCard
          label="Volume da semana"
          value={`${alunoStats.volumeSemanaKg.toLocaleString("pt-BR")} kg`}
          icon={TrendingUp}
        />
        <StatCard
          label="Tempo médio"
          value={`${alunoStats.tempoMedioMinutos} min`}
          icon={Clock}
        />
      </section>

      {/* Próximos Treinos (horizontal scroll on mobile) */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-h2 text-text-primary">Próximos treinos</h2>
          <Link
            href="/historico"
            className="text-caption text-accent hover:underline"
          >
            Ver tudo
          </Link>
        </div>
        <div className="-mx-4 px-4 lg:mx-0 lg:px-0 flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory">
          {upcomingSessions.map((u, i) => (
            <Link
              key={`${u.date}-${i}`}
              href={`/treino/${u.session.id}`}
              className="snap-start shrink-0 w-[200px]"
            >
              <Card variant="interactive" className="h-full">
                <p className="text-caption text-text-muted uppercase tracking-[0.08em]">
                  {capitalize(formatDayMonth(u.date).split(",")[0])}
                </p>
                <p className="mt-2 text-body-lg text-text-primary font-semibold">
                  Treino {u.session.letter}
                </p>
                <p className="text-caption text-text-secondary">
                  {u.session.name}
                </p>
                <div className="mt-3">
                  <Badge>{u.session.exercises.length} exercícios</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Evolução Rápida */}
      <section>
        <Card variant="default" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption text-text-muted">Peso corporal</p>
              <p className="text-h2 text-text-primary tnum">
                {currentWeight.toFixed(1)} kg
              </p>
            </div>
            <span
              className={`tnum text-body font-semibold ${
                weightDelta <= 0 ? "text-success" : "text-warning"
              }`}
            >
              {weightDelta > 0 ? "+" : ""}
              {weightDelta.toFixed(1)} kg
            </span>
          </div>
          <WeightSparkline data={last4WeeksWeight} />
          <Link
            href="/evolucao"
            className="text-caption text-accent hover:underline self-start"
          >
            Ver evolução completa →
          </Link>
        </Card>
      </section>
    </div>
  );
}
