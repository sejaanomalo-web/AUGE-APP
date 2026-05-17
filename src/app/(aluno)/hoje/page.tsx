import Link from "next/link";
import {
  Activity,
  CalendarClock,
  MessageCircle,
  Target,
} from "lucide-react";
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
  const consistencyPct =
    weeklyFreq > 0
      ? Math.min(100, Math.round((stats.completedWorkouts / weeklyFreq) * 100))
      : 0;
  const estimatedMin = session ? Math.max(20, session.exercises.length * 4) : 0;
  const nextSession = plan
    ? plan.sessions
        .map((s) => ({
          ...s,
          distance: (s.dayOfWeek - todayDow + 7) % 7 || 7,
        }))
        .sort((a, b) => a.distance - b.distance)[0]
    : null;
  const greeting =
    today.getHours() < 12
      ? "Bom dia"
      : today.getHours() < 18
        ? "Boa tarde"
        : "Boa noite";
  const ctaHref = todayCompleted
    ? `/historico/${todayCompleted.id}`
    : inProgressLog
      ? `/treino/${session!.id}/executar`
      : session
        ? `/treino/${session.id}`
        : "#";
  const ctaLabel = todayCompleted
    ? "Ver resumo"
    : inProgressLog
      ? "Retomar treino"
      : "Iniciar treino";

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <section className="flex flex-col gap-1">
        <div className="text-stat-label text-text-muted uppercase">
          {capitalize(formatDayMonth(today.toISOString().slice(0, 10)))}
        </div>
        <h1 className="text-hero-name text-text-primary">
          {greeting}, {firstName}
        </h1>
        <p className="text-body-lg text-text-secondary">
          {session && !todayCompleted
            ? "Seu treino está pronto."
            : todayCompleted
              ? "Missão concluída. Evolução registrada."
              : "Sem missão ativa para hoje."}
        </p>
      </section>

      {!plan ? (
        <HeroCard
          intensity="strong"
          className="min-h-[280px] sm:min-h-[320px] p-6 sm:p-8 flex flex-col justify-center gap-4"
        >
          <Badge variant="warning" className="self-start">
            Sem plano ativo
          </Badge>
          <h2 className="text-hero-name text-text-primary max-w-md">
            Sem missão para hoje.
          </h2>
          <p className="text-body-lg text-text-secondary max-w-md">
            Seu personal ainda não atribuiu um treino ativo. Quando o plano
            estiver pronto, a missão aparece aqui.
          </p>
        </HeroCard>
      ) : isRest ? (
        <HeroCard
          intensity="strong"
          className="min-h-[280px] sm:min-h-[320px] p-6 sm:p-8 flex flex-col justify-center gap-4"
        >
          <Badge variant="info" className="self-start">
            Recuperação
          </Badge>
          <h2 className="text-hero-name text-text-primary max-w-md">
            Hoje é dia de recuperar.
          </h2>
          <p className="text-body-lg text-text-secondary max-w-md">
            Sem treino prescrito para hoje. Use o dia para sono, hidratação e
            mobilidade leve.
          </p>
        </HeroCard>
      ) : (
        <HeroCard
          intensity="strong"
          className="min-h-[420px] sm:min-h-[440px] p-6 sm:p-8 flex flex-col justify-between gap-6"
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="new">Missão de hoje</Badge>
              {inProgressLog && (
                <Badge variant="in_progress">Em andamento</Badge>
              )}
              {todayCompleted && <Badge variant="concluido">Concluído</Badge>}
              <Badge variant="intensity">Alta intensidade</Badge>
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
              <span>{plan.name}</span>
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between text-caption text-text-secondary mb-1.5">
                <span className="text-stat-label uppercase text-text-muted">
                  Progresso semanal
                </span>
                <span className="tnum font-bold text-text-primary">
                  {consistencyPct}%
                </span>
              </div>
              <Progress
                value={stats.completedWorkouts}
                max={weeklyFreq || 1}
              />
            </div>
          </div>

          <LinkButton variant="primary" size="cta" fullWidth href={ctaHref}>
            <Target size={18} aria-hidden />
            {ctaLabel}
          </LinkButton>
        </HeroCard>
      )}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HeroCard className="p-5">
          <StatHero
            value={`${consistencyPct}%`}
            label="Consistência"
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
                <Activity
                  size={24}
                  strokeWidth={2.5}
                  className="text-accent"
                  aria-hidden
                />
              </span>
            }
            label="Sequência"
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
            label="Carga semanal"
            size="sm"
          />
        </HeroCard>
        <HeroCard className="p-5">
          <StatHero
            value={stats.avgMinutes > 0 ? `${stats.avgMinutes}` : "—"}
            label={stats.avgMinutes > 0 ? "Minutos médios" : "Tempo médio"}
            size="sm"
          />
        </HeroCard>
      </section>

      {(plan?.description || nextSession) && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {plan?.description && (
            <HeroCard intensity="subtle" className="p-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-coach/15 border border-coach/30 flex items-center justify-center shrink-0">
                  <MessageCircle size={18} className="text-coach" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-stat-label uppercase text-coach">
                    Coach Note
                  </p>
                  <h2 className="mt-2 text-h3 text-text-primary">
                    Orientação do personal
                  </h2>
                  <p className="mt-2 text-body text-text-secondary leading-relaxed">
                    {plan.description}
                  </p>
                </div>
              </div>
            </HeroCard>
          )}

          {nextSession && (
            <HeroCard bare className="p-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center shrink-0">
                  <CalendarClock
                    size={18}
                    className="text-accent"
                    aria-hidden
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-stat-label uppercase text-text-muted">
                    Próxima sessão
                  </p>
                  <h2 className="mt-2 text-h3 text-text-primary truncate">
                    {nextSession.name}
                  </h2>
                  <p className="mt-1 text-body text-text-secondary">
                    {nextSession.exercises.length} exercícios no plano.
                  </p>
                </div>
              </div>
            </HeroCard>
          )}
        </section>
      )}

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
              Ver evolução completa
            </Link>
          </HeroCard>
        </section>
      )}
    </div>
  );
}
