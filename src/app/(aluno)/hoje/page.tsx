import Link from "next/link";
import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { Progress } from "@/components/ui/Progress";
import { HeroCard } from "@/components/visual/HeroCard";
import { StatHero } from "@/components/visual/StatHero";
import { WeightSparkline } from "@/components/aluno/WeightSparkline";
import { capitalize, formatDayMonth } from "@/lib/date";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getActivePlanForStudent } from "@/lib/actions/workout-plans";
import { getAlunoWeeklyStats } from "@/lib/aluno-stats";

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

  const firstName = user.name.split(" ")[0];
  const weeklyFreq = plan?.sessions.length ?? 0;
  const estimatedMin = session ? Math.max(20, session.exercises.length * 4) : 0;
  const ctaHref = todayCompleted
    ? `/historico/${todayCompleted.id}`
    : inProgressLog
      ? `/treino/${session!.id}/executar`
      : session
        ? `/treino/${session.id}`
        : "#";
  const ctaLabel = todayCompleted
    ? "Ver detalhes →"
    : inProgressLog
      ? "Retomar treino →"
      : "Iniciar treino →";

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      {/* Saudação minimalista */}
      <section className="flex flex-col gap-1">
        <div className="text-stat-label text-text-muted uppercase">
          {capitalize(formatDayMonth(today.toISOString().slice(0, 10)))}
        </div>
        <h1 className="text-hero-name text-text-primary">Olá, {firstName}</h1>
      </section>

      {/* Hero do treino — Netflix-style, sempre em dourado */}
      {!plan ? (
        <HeroCard
          intensity="strong"
          className="min-h-[280px] sm:min-h-[320px] p-6 sm:p-8 flex flex-col justify-center gap-4"
        >
          <span className="inline-block self-start px-3 py-1 rounded-pill bg-accent/15 text-accent text-stat-label uppercase">
            Sem plano
          </span>
          <h2 className="text-hero-name text-text-primary max-w-md">
            Você ainda não tem um plano ativo
          </h2>
          <p className="text-body-lg text-text-secondary max-w-md">
            Aguarde seu personal criar um plano de treino para você. Quando
            estiver pronto, você verá o treino do dia aqui.
          </p>
        </HeroCard>
      ) : isRest ? (
        <HeroCard
          intensity="strong"
          className="min-h-[280px] sm:min-h-[320px] p-6 sm:p-8 flex flex-col justify-center gap-4"
        >
          <span className="inline-block self-start px-3 py-1 rounded-pill bg-accent/15 text-accent text-stat-label uppercase">
            Descanso
          </span>
          <h2 className="text-hero-name text-text-primary max-w-md">
            Hoje é dia de descanso
          </h2>
          <p className="text-body-lg text-text-secondary max-w-md">
            Aproveite para hidratar bem e dormir cedo. Amanhã tem treino.
          </p>
        </HeroCard>
      ) : (
        <HeroCard
          intensity="strong"
          className="min-h-[420px] sm:min-h-[440px] p-6 sm:p-8 flex flex-col justify-between gap-6"
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block px-3 py-1 rounded-pill bg-accent/15 text-accent text-stat-label uppercase">
                Treino · {stats.completedWorkouts}/{weeklyFreq}
              </span>
              {inProgressLog && (
                <Badge variant="in_progress">Em andamento</Badge>
              )}
              {todayCompleted && <Badge variant="concluido">Concluído</Badge>}
            </div>
            <h2 className="text-hero-name text-text-primary max-w-md">
              {session.name}
            </h2>
            <div className="flex items-center gap-3 text-body-lg text-text-secondary flex-wrap">
              <span className="tnum">
                {session.exercises.length} exercícios
              </span>
              <span aria-hidden>·</span>
              <span className="tnum">~{estimatedMin} min</span>
              <span aria-hidden>·</span>
              <span>plano {plan.name}</span>
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between text-caption text-text-secondary mb-1.5">
                <span className="text-stat-label uppercase text-text-muted">
                  Esta semana
                </span>
                <span className="tnum font-bold text-text-primary">
                  {stats.completedWorkouts} / {weeklyFreq}
                </span>
              </div>
              <Progress
                value={stats.completedWorkouts}
                max={weeklyFreq || 1}
              />
            </div>
          </div>

          <LinkButton variant="primary" size="cta" fullWidth href={ctaHref}>
            {ctaLabel}
          </LinkButton>
        </HeroCard>
      )}

      {/* Stats row — números gigantes */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HeroCard className="p-5">
          <StatHero
            value={`${stats.completedWorkouts}/${weeklyFreq || 0}`}
            label="Treinos da semana"
            size="sm"
          />
        </HeroCard>
        <HeroCard
          className="p-5"
          bare={stats.streakDays === 0}
        >
          <StatHero
            value={
              <span className="inline-flex items-center gap-2">
                {stats.streakDays}
                {stats.streakDays > 0 && (
                  <Flame
                    size={26}
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
        <HeroCard className="p-5">
          <StatHero
            value={
              stats.volume > 0
                ? `${(stats.volume / 1000).toFixed(1)}k`
                : "—"
            }
            label="kg esta semana"
            size="sm"
          />
        </HeroCard>
        <HeroCard className="p-5">
          <StatHero
            value={stats.avgMinutes > 0 ? `${stats.avgMinutes}` : "—"}
            label={stats.avgMinutes > 0 ? "Min médios" : "Tempo médio"}
            size="sm"
          />
        </HeroCard>
      </section>

      {/* Peso corporal */}
      {last4Weight.length >= 2 && (
        <section>
          <HeroCard className="p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <StatHero
                value={
                  <span>
                    {currentWeight.toFixed(1)}
                    <span className="text-stat-medium text-text-muted ml-1 not-italic">
                      kg
                    </span>
                  </span>
                }
                label="Peso corporal"
                size="sm"
                variation={
                  weightDelta === 0
                    ? undefined
                    : {
                        value: Math.round(
                          (Math.abs(weightDelta) / (firstWeight || 1)) * 100,
                        ),
                        type:
                          weightDelta < 0
                            ? "positive"
                            : weightDelta > 0
                              ? "negative"
                              : "neutral",
                      }
                }
              />
            </div>
            <WeightSparkline data={last4Weight} />
            <Link
              href="/evolucao"
              className="text-caption text-accent hover:underline self-start"
            >
              Ver evolução completa →
            </Link>
          </HeroCard>
        </section>
      )}
    </div>
  );
}
