import Link from "next/link";
import { Clock, Dumbbell, Flame, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/LinkButton";
import { Progress } from "@/components/ui/Progress";
import { StatCard } from "@/components/shared/StatCard";
import { WeightSparkline } from "@/components/aluno/WeightSparkline";
import { capitalize, formatDayMonth } from "@/lib/date";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getActivePlanForStudent } from "@/lib/actions/workout-plans";
import {
  getAlunoWeeklyStats,
  nextUpcomingSessions,
} from "@/lib/aluno-stats";

export default async function HojePage() {
  const user = await requireRole("ALUNO");
  const plan = await getActivePlanForStudent(user.id);
  const stats = await getAlunoWeeklyStats(user.id);
  const metrics = await prisma.bodyMetric.findMany({
    where: { studentId: user.id },
    orderBy: { date: "desc" },
    take: 4,
  });

  const today = new Date();
  const todayDow = today.getDay();
  const session = plan?.sessions.find((s) => s.dayOfWeek === todayDow);
  const isRest = !session;
  const inProgressLog = session
    ? await prisma.workoutLog.findFirst({
        where: {
          sessionId: session.id,
          studentId: user.id,
          status: "IN_PROGRESS",
        },
      })
    : null;
  const todayCompleted = session
    ? await prisma.workoutLog.findFirst({
        where: {
          sessionId: session.id,
          studentId: user.id,
          status: "COMPLETED",
          startedAt: {
            gte: new Date(today.toISOString().slice(0, 10) + "T00:00:00"),
          },
        },
      })
    : null;

  const upcoming = plan ? nextUpcomingSessions(plan.sessions, today, 5) : [];

  const last4Weight = metrics
    .filter((m) => m.weight)
    .slice()
    .reverse()
    .map((m) => ({
      date: m.date.toISOString().slice(0, 10),
      weightKg: m.weight!,
    }));
  const currentWeight = last4Weight.at(-1)?.weightKg ?? 0;
  const firstWeight = last4Weight[0]?.weightKg ?? currentWeight;
  const weightDelta = currentWeight - firstWeight;

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <section>
        <h1 className="text-h1 text-text-primary">
          Olá, {user.name.split(" ")[0]} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1 text-body-lg text-text-secondary">
          {capitalize(formatDayMonth(today.toISOString().slice(0, 10)))}
        </p>
      </section>

      {!plan ? (
        <Card variant="default">
          <Badge>Sem plano</Badge>
          <h2 className="mt-2 text-h2 text-text-primary">
            Você ainda não tem um plano ativo
          </h2>
          <p className="mt-1 text-body text-text-secondary">
            Aguarde seu personal criar um plano de treino para você. Quando
            estiver pronto, você verá o treino do dia aqui.
          </p>
        </Card>
      ) : isRest ? (
        <Card variant="default">
          <Badge>Descanso</Badge>
          <h2 className="mt-2 text-h2 text-text-primary">
            Hoje é dia de descanso
          </h2>
          <p className="mt-1 text-body text-text-secondary">
            Aproveite para hidratar bem e dormir cedo. Amanhã tem treino.
          </p>
        </Card>
      ) : (
        <Card variant="highlight" className="flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge>{session.name}</Badge>
            {inProgressLog && (
              <Badge variant="in_progress">Em andamento</Badge>
            )}
            {todayCompleted && <Badge variant="concluido">Concluído</Badge>}
          </div>
          <h2 className="text-h2 text-text-primary">{session.name}</h2>
          <p className="text-body text-text-secondary">
            {plan.sessions.length}x semana · plano {plan.name}
          </p>

          <div className="mt-1">
            <div className="flex items-center justify-between text-caption text-text-secondary mb-1.5">
              <span>Esta semana</span>
              <span className="tnum">
                {stats.completedWorkouts} de {plan.sessions.length} treinos
              </span>
            </div>
            <Progress
              value={stats.completedWorkouts}
              max={plan.sessions.length}
            />
          </div>

          {todayCompleted ? (
            <LinkButton
              variant="tertiary"
              size="md"
              href={`/historico/${todayCompleted.id}`}
            >
              Ver detalhes →
            </LinkButton>
          ) : inProgressLog ? (
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

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Treinos da semana"
          value={`${stats.completedWorkouts}/${plan?.sessions.length ?? 0}`}
          hint={
            plan ? (
              <Progress
                value={stats.completedWorkouts}
                max={plan.sessions.length || 1}
                thin
                className="mt-1"
              />
            ) : null
          }
          icon={Dumbbell}
        />
        <StatCard
          label="Streak atual"
          value={
            <span className="inline-flex items-center gap-1.5">
              {stats.streakDays} dias{" "}
              {stats.streakDays > 0 && (
                <Flame size={20} aria-hidden />
              )}
            </span>
          }
          icon={Flame}
          accent={stats.streakDays > 0}
        />
        <StatCard
          label="Volume da semana"
          value={
            stats.volume > 0
              ? `${stats.volume.toLocaleString("pt-BR")} kg`
              : "—"
          }
          icon={TrendingUp}
        />
        <StatCard
          label="Tempo médio"
          value={stats.avgMinutes > 0 ? `${stats.avgMinutes} min` : "—"}
          icon={Clock}
        />
      </section>

      {plan && upcoming.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-h2 text-text-primary">Próximos treinos</h2>
            <Link
              href="/planos"
              className="text-caption text-accent hover:underline"
            >
              Ver tudo
            </Link>
          </div>
          <div className="-mx-4 px-4 lg:mx-0 lg:px-0 flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory">
            {upcoming.map((u, i) => {
              const isNext = i === 0;
              return (
                <Link
                  key={`${u.session.id}-${i}`}
                  href={`/treino/${u.session.id}`}
                  className="snap-start shrink-0 w-[200px]"
                >
                  <Card
                    variant="interactive"
                    className={
                      isNext
                        ? "h-full !border-accent/60 ring-1 ring-accent/30 shadow-accent"
                        : "h-full"
                    }
                  >
                    <p
                      className={`text-caption uppercase tracking-[0.08em] ${
                        isNext ? "text-accent font-bold" : "text-text-muted"
                      }`}
                    >
                      {isNext
                        ? "Próximo"
                        : capitalize(
                            formatDayMonth(
                              u.date.toISOString().slice(0, 10),
                            ).split(",")[0],
                          )}
                    </p>
                    <p className="mt-2 text-body-lg text-text-primary font-semibold">
                      {u.session.name}
                    </p>
                    <div className="mt-3">
                      <Badge>{u.session.exercises.length} exercícios</Badge>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {last4Weight.length >= 2 && (
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
            <WeightSparkline data={last4Weight} />
            <Link
              href="/evolucao"
              className="text-caption text-accent hover:underline self-start"
            >
              Ver evolução completa →
            </Link>
          </Card>
        </section>
      )}
    </div>
  );
}
