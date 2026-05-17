import Link from "next/link";
import { CalendarClock, Target } from "lucide-react";
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

const WEEKDAY_LABELS_PT = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];

/**
 * Computes "now" in São Paulo time and returns a triple that's useful
 * regardless of the server's TZ:
 *
 *   - date            : a Date whose local getters (getDay, getHours, …)
 *                       return BR-local values.
 *   - isoDate         : "YYYY-MM-DD" of today in BR.
 *   - startOfDayUtc   : Date pointing at 00:00 BR translated to UTC
 *                       (BR is UTC-3 year-round since 2019). Used as the
 *                       lower bound for "logs from today" queries.
 *
 * Vercel runs in UTC, which made `new Date().getDay()` flip to tomorrow
 * after ~21h BRT and trip the rest-day branch on real training days.
 */
function getBrazilNow(): {
  date: Date;
  isoDate: string;
  startOfDayUtc: Date;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const y = get("year");
  const m = get("month");
  const d = get("day");
  const local = new Date(
    Number(y),
    Number(m) - 1,
    Number(d),
    Number(get("hour")),
    Number(get("minute")),
    Number(get("second")),
  );
  return {
    date: local,
    isoDate: `${y}-${m}-${d}`,
    startOfDayUtc: new Date(`${y}-${m}-${d}T03:00:00.000Z`),
  };
}

/** Copy for the rest-day hero, picked from context. */
function pickRestCopy(today: Date, tomorrowHasSession: boolean, tomorrowName?: string) {
  const dow = today.getDay();
  const isWeekend = dow === 0 || dow === 6;

  if (tomorrowHasSession) {
    return {
      badge: { label: "Hoje é off", variant: "new" as const },
      title: "Recarregue para amanhã.",
      body: tomorrowName
        ? `Amanhã: ${tomorrowName}. Hoje hidrate bem, durma cedo e chegue inteiro.`
        : "Amanhã tem treino. Hoje hidrate bem, durma cedo e chegue inteiro.",
    };
  }

  if (isWeekend) {
    return {
      badge: { label: "Final de semana", variant: "info" as const },
      title: "Pausa estratégica.",
      body: "Fim de semana sem treino prescrito. Aproveite para sair, comer bem e recarregar.",
    };
  }

  return {
    badge: { label: "Recuperação", variant: "info" as const },
    title: "Hoje é dia de recuperar.",
    body: "Sem treino prescrito. Use o dia para sono, hidratação e mobilidade leve.",
  };
}

/** Subtitle next to the greeting - varies by day-of-week + time. */
function pickGreetingSubtitle(args: {
  today: Date;
  hasSession: boolean;
  isCompleted: boolean;
  inProgress: boolean;
  tomorrowHasSession: boolean;
}) {
  const { today, hasSession, isCompleted, inProgress, tomorrowHasSession } =
    args;
  if (isCompleted) return "Missão concluída. Evolução registrada.";
  if (inProgress) return "Treino em andamento. Continue forte.";

  if (hasSession) {
    const hour = today.getHours();
    const dow = today.getDay();
    if (dow === 1) return "Segunda-feira: dê o tom da semana.";
    if (dow === 5) return "Sexta-feira: feche a semana forte.";
    if (hour < 10) return "Treino logo cedo. Abre o dia com força.";
    if (hour >= 18)
      return "Treino do fim do dia. Quebra o estresse antes de descansar.";
    return "Seu treino está pronto. Bora pro próximo PR.";
  }

  if (tomorrowHasSession) return "Hoje é descanso - amanhã tem treino.";
  return "Sem missão ativa para hoje.";
}

export default async function HojePage() {
  const user = await requireRole("ALUNO");
  const plan = await getActivePlanForStudent(user.id);
  const stats = await getAlunoWeeklyStats(user.id);
  const metrics = await prisma.bodyMetric.findMany({
    where: { studentId: user.id },
    orderBy: { date: "desc" },
    take: 4,
  });

  const brNow = getBrazilNow();
  const today = brNow.date;
  const todayDow = today.getDay();
  const tomorrowDow = (todayDow + 1) % 7;
  const session = plan?.sessions.find((s) => s.dayOfWeek === todayDow);
  const tomorrowSession = plan?.sessions.find(
    (s) => s.dayOfWeek === tomorrowDow,
  );
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
          // Today defined as BR-local midnight, converted to UTC.
          startedAt: { gte: brNow.startOfDayUtc },
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
        .filter(
          (s): s is typeof s & { dayOfWeek: number } => s.dayOfWeek != null,
        )
        .map((s) => ({
          ...s,
          distance: (s.dayOfWeek - todayDow + 7) % 7 || 7,
        }))
        .sort((a, b) => a.distance - b.distance)[0] ?? null
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

  // Pre-compute the context-aware copy on the server so it lands in the
  // first paint (no client flash when the day or message changes).
  const restCopy = pickRestCopy(today, !!tomorrowSession, tomorrowSession?.name);
  const greetingSubtitle = pickGreetingSubtitle({
    today,
    hasSession: !!session,
    isCompleted: !!todayCompleted,
    inProgress: !!inProgressLog,
    tomorrowHasSession: !!tomorrowSession,
  });

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <section className="flex flex-col gap-1">
        <div className="text-stat-label text-text-muted uppercase">
          {capitalize(formatDayMonth(brNow.isoDate))}
        </div>
        <h1 className="text-hero-name text-text-primary">
          {greeting}, {firstName}
        </h1>
        <p className="text-body-lg text-text-secondary">{greetingSubtitle}</p>
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
          <Badge variant={restCopy.badge.variant} className="self-start">
            {restCopy.badge.label}
          </Badge>
          <h2 className="text-hero-name text-text-primary max-w-md">
            {restCopy.title}
          </h2>
          <p className="text-body-lg text-text-secondary max-w-md">
            {restCopy.body}
          </p>
          {tomorrowSession && (
            <p className="text-caption text-text-muted">
              Próximo treino -{" "}
              <span className="text-text-secondary font-semibold">
                {capitalize(WEEKDAY_LABELS_PT[tomorrowDow])}
              </span>
            </p>
          )}
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
        <HeroCard className="p-5">
          <StatHero
            value={stats.monthCount}
            label="Treinos no mês"
            size="sm"
          />
        </HeroCard>
        <HeroCard className="p-5">
          <StatHero
            value={stats.completedWorkouts}
            label="Treinos totais da semana"
            size="sm"
          />
        </HeroCard>
        <HeroCard className="p-5">
          <StatHero
            value={
              stats.avgMinutes > 0 ? `${stats.avgMinutes} min` : "-"
            }
            label="Tempo médio dos treinos"
            size="sm"
          />
        </HeroCard>
      </section>

      {nextSession && (
        <section>
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
