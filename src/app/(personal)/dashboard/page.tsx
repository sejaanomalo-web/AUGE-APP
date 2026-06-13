import Link from "next/link";
import { Target, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/LinkButton";
import { Progress } from "@/components/ui/Progress";
import { HeroCard } from "@/components/visual/HeroCard";
import { StatHero } from "@/components/visual/StatHero";
import { EmptyState } from "@/components/shared/EmptyState";
import { capitalize, formatDayMonth, formatRelativeFromNow } from "@/lib/date";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek, subDays } from "date-fns";

export default async function DashboardPersonalPage() {
  const personal = await requireRole("PERSONAL");
  const todayIso = new Date().toISOString().slice(0, 10);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  // Active students
  const studentLinks = await prisma.trainerStudent.findMany({
    where: { trainerId: personal.id, status: { in: ["ACTIVE", "PAUSED"] } },
    include: { student: true },
  });
  const studentIds = studentLinks.map((l) => l.studentId);

  // Quatro consultas independentes buscadas em paralelo: logs da semana,
  // planos ativos dos alunos (só a contagem de sessões), treinos concluídos
  // por aluno nos últimos 28 dias e os treinos ativos do personal. Antes a
  // aderência fazia 2 round-trips por aluno EM SÉRIE (O(2N)); agora são 2
  // queries agregadas — o TTFB do painel deixa de crescer com a carteira.
  const fourWeeksAgo = subDays(new Date(), 28);
  const [logsThisWeek, activePlans, doneCounts, plans] = await Promise.all([
    studentIds.length
      ? prisma.workoutLog.findMany({
          where: {
            studentId: { in: studentIds },
            startedAt: { gte: weekStart, lte: weekEnd },
          },
          include: { student: true, session: true },
          orderBy: { startedAt: "desc" },
          take: 30,
        })
      : Promise.resolve([]),
    studentIds.length
      ? prisma.workoutPlan.findMany({
          where: { studentId: { in: studentIds }, isActive: true },
          select: { studentId: true, _count: { select: { sessions: true } } },
        })
      : Promise.resolve([]),
    studentIds.length
      ? prisma.workoutLog.groupBy({
          by: ["studentId"],
          where: {
            studentId: { in: studentIds },
            status: "COMPLETED",
            startedAt: { gte: fourWeeksAgo },
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    prisma.workoutPlan.findMany({
      where: { trainerId: personal.id, isActive: true },
      include: { sessions: true },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
  ]);

  const finishedToday = logsThisWeek.filter(
    (l) =>
      l.status === "COMPLETED" &&
      l.startedAt.toISOString().slice(0, 10) === todayIso,
  ).length;
  const startedToday = logsThisWeek.filter(
    (l) =>
      l.status === "IN_PROGRESS" &&
      l.startedAt.toISOString().slice(0, 10) === todayIso,
  ).length;
  const activeThisWeekIds = new Set(logsThisWeek.map((l) => l.studentId));
  const inactiveThisWeek = Math.max(
    0,
    studentLinks.length - activeThisWeekIds.size,
  );

  // Aderência: sessões prescritas nas últimas 4 semanas vs concluídas.
  // Sessões prescritas por aluno = soma das sessões de todos os planos ativos
  // do aluno (sem filtrar trainerId, igual ao comportamento original).
  const prescribedByStudent = new Map<string, number>();
  for (const p of activePlans) {
    prescribedByStudent.set(
      p.studentId,
      (prescribedByStudent.get(p.studentId) ?? 0) + p._count.sessions,
    );
  }
  const doneByStudent = new Map<string, number>();
  for (const d of doneCounts) {
    doneByStudent.set(d.studentId, d._count._all);
  }
  // Iterar studentLinks preserva a ordem original (desempate estável do sort
  // por aderência abaixo); alunos sem plano/log entram com 0, como antes.
  const adherenceByStudent = studentLinks.map((link) => {
    const expected = (prescribedByStudent.get(link.studentId) ?? 0) * 4; // 4 weeks
    const done = doneByStudent.get(link.studentId) ?? 0;
    const adherence = expected > 0 ? Math.min(100, (done / expected) * 100) : 0;
    return { studentId: link.studentId, adherence };
  });
  // Lista completa de alunos com aproveitamento (pior primeiro)
  const studentsAdherence = adherenceByStudent
    .map((s) => {
      const link = studentLinks.find((l) => l.studentId === s.studentId);
      return { user: link!.student, adherence: Math.round(s.adherence) };
    })
    .sort((a, b) => a.adherence - b.adherence);
  const avgAdherence = studentsAdherence.length
    ? Math.round(
        studentsAdherence.reduce((acc, s) => acc + s.adherence, 0) /
          studentsAdherence.length,
      )
    : 0;

  // (treinos ativos do personal já buscados no Promise.all acima como `plans`)

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <div className="text-stat-label text-text-muted uppercase">
          {capitalize(formatDayMonth(todayIso))}
        </div>
        <h1 className="text-hero-name text-text-primary">
          Painel do Personal
        </h1>
        <p className="text-body-lg text-text-secondary">
          Controle de alunos, aderência e aproveitamento dos alunos.
        </p>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HeroCard className="p-5">
          <StatHero
            value={studentLinks.length}
            label="Alunos ativos"
            size="sm"
          />
        </HeroCard>
        <HeroCard className="p-5">
          <StatHero
            value={finishedToday + startedToday}
            label="Treinaram hoje"
            size="sm"
          />
        </HeroCard>
        <HeroCard className="p-5">
          <StatHero
            value={`${avgAdherence}%`}
            label="Aproveitamento médio"
            size="sm"
          />
        </HeroCard>
        <HeroCard className="p-5">
          <StatHero
            value={inactiveThisWeek}
            label="Sem atividade"
            size="sm"
          />
        </HeroCard>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card variant="default" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 text-text-primary">Status dos alunos</h2>
            {logsThisWeek.length > 0 && <Badge>{logsThisWeek.length}</Badge>}
          </div>
          {logsThisWeek.length === 0 ? (
            <p className="text-body text-text-secondary">
              Nenhuma atividade esta semana. Quando um aluno iniciar ou
              concluir um treino, o status aparece aqui.
            </p>
          ) : (
            <ul className="flex flex-col">
              {logsThisWeek.slice(0, 8).map((ev, i) => (
                <li
                  key={ev.id}
                  className={`py-3 flex items-start gap-3 ${
                    i !== logsThisWeek.slice(0, 8).length - 1
                      ? "border-b border-border-subtle"
                      : ""
                  }`}
                >
                  <Avatar
                    name={ev.student.name}
                    src={ev.student.avatarUrl ?? undefined}
                    size={36}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-body text-text-primary">
                      <span className="font-semibold">
                        {ev.student.name}
                      </span>{" "}
                      <span className="text-text-secondary">
                        {ev.status === "COMPLETED"
                          ? "finalizou"
                          : ev.status === "IN_PROGRESS"
                            ? "iniciou"
                            : "abandonou"}{" "}
                        {ev.session.name}
                      </span>
                    </p>
                    <p className="text-caption text-text-muted">
                      {formatRelativeFromNow(
                        ev.startedAt.toISOString(),
                        new Date().toISOString(),
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card variant="default">
            <div className="mb-3">
              <h3 className="text-h3 text-text-primary">
                Aproveitamento dos alunos
              </h3>
              <p className="text-caption text-text-muted">
                Treinos concluídos vs propostos nos últimos 28 dias
              </p>
            </div>
            {studentsAdherence.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Sem alunos vinculados"
                description="Vincule alunos para acompanhar o aproveitamento."
              />
            ) : (
              <>
                <ul className="flex flex-col gap-3">
                  {studentsAdherence.map((s) => {
                    const variant =
                      s.adherence >= 80
                        ? "concluido"
                        : s.adherence >= 60
                          ? "warning"
                          : "erro";
                    return (
                      <li key={s.user.id} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            href={`/alunos/${s.user.id}`}
                            className="flex items-center gap-2 min-w-0 hover:text-text-primary"
                          >
                            <Avatar
                              name={s.user.name}
                              src={s.user.avatarUrl ?? undefined}
                              size={28}
                            />
                            <span className="text-body text-text-primary truncate">
                              {s.user.name}
                            </span>
                          </Link>
                          <Badge variant={variant}>{s.adherence}%</Badge>
                        </div>
                        <Progress value={s.adherence} />
                      </li>
                    );
                  })}
                </ul>
                <LinkButton
                  variant="tertiary"
                  size="md"
                  href="/alunos"
                  className="mt-3"
                >
                  Ver alunos
                </LinkButton>
              </>
            )}
          </Card>

          {plans.length > 0 ? (
            <Card variant="default">
              <h3 className="text-h3 text-text-primary mb-3">Treinos ativos</h3>
              <ul className="flex flex-col gap-2">
                {plans.map((p) => {
                  const link = studentLinks.find(
                    (l) => l.studentId === p.studentId,
                  );
                  return (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-body text-text-primary truncate">
                          {p.name}
                        </p>
                        <p className="text-caption text-text-muted truncate">
                          {link?.student.name ?? "-"}
                        </p>
                      </div>
                      <Badge>{p.sessions.length}x</Badge>
                    </li>
                  );
                })}
              </ul>
              <LinkButton
                variant="tertiary"
                size="md"
                href="/treinos"
                className="mt-3"
              >
                Ver treinos
              </LinkButton>
            </Card>
          ) : (
            <Card variant="default">
              <EmptyState
                icon={Target}
                title="Sem planos ativos"
                description="Crie um plano para iniciar o acompanhamento."
                action={
                  <LinkButton href="/treinos/novo" variant="primary" size="md">
                    Criar plano
                  </LinkButton>
                }
              />
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
