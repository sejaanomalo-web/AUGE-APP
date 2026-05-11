import Link from "next/link";
import {
  AlertTriangle,
  Dumbbell,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/LinkButton";
import { StatCard } from "@/components/shared/StatCard";
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

  // Logs this week (across all students)
  const logsThisWeek = studentIds.length
    ? await prisma.workoutLog.findMany({
        where: {
          studentId: { in: studentIds },
          startedAt: { gte: weekStart, lte: weekEnd },
        },
        include: { student: true, session: true },
        orderBy: { startedAt: "desc" },
        take: 30,
      })
    : [];

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

  // Adherence: prescribed sessions in last 4 weeks vs completed
  const fourWeeksAgo = subDays(new Date(), 28);
  const adherenceByStudent: { studentId: string; adherence: number }[] = [];
  for (const link of studentLinks) {
    const plans = await prisma.workoutPlan.findMany({
      where: { studentId: link.studentId, isActive: true },
      include: { sessions: true },
    });
    const sessionsPerWeek = plans.reduce((a, p) => a + p.sessions.length, 0);
    const expected = sessionsPerWeek * 4; // 4 weeks
    const done = await prisma.workoutLog.count({
      where: {
        studentId: link.studentId,
        status: "COMPLETED",
        startedAt: { gte: fourWeeksAgo },
      },
    });
    const adherence = expected > 0 ? Math.min(100, (done / expected) * 100) : 0;
    adherenceByStudent.push({ studentId: link.studentId, adherence });
  }
  const avgAdherence =
    adherenceByStudent.length > 0
      ? Math.round(
          adherenceByStudent.reduce((a, s) => a + s.adherence, 0) /
            adherenceByStudent.length,
        )
      : 0;
  const lowAdherence = adherenceByStudent
    .filter((s) => s.adherence < 70)
    .map((s) => {
      const link = studentLinks.find((l) => l.studentId === s.studentId);
      return { user: link!.student, adherence: Math.round(s.adherence) };
    });

  // Active plans summary
  const plans = await prisma.workoutPlan.findMany({
    where: { trainerId: personal.id, isActive: true },
    include: { sessions: true },
    orderBy: { updatedAt: "desc" },
    take: 4,
  });

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <section>
        <h1 className="text-h1 text-text-primary">
          Olá, {personal.name.split(" ")[0]} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1 text-body-lg text-text-secondary">
          {capitalize(formatDayMonth(todayIso))}
        </p>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Alunos ativos" value={studentLinks.length} icon={Users} />
        <StatCard
          label="Treinos hoje"
          value={finishedToday + startedToday}
          hint={`${finishedToday} finalizado · ${startedToday} em andamento`}
          icon={Dumbbell}
        />
        <StatCard
          label="Treinos da semana"
          value={
            logsThisWeek.filter((l) => l.status === "COMPLETED").length
          }
          icon={TrendingUp}
        />
        <StatCard
          label="Aderência média"
          value={studentLinks.length > 0 ? `${avgAdherence}%` : "—"}
          icon={Target}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card variant="default" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 text-text-primary">Atividade recente</h2>
            {logsThisWeek.length > 0 && <Badge>{logsThisWeek.length}</Badge>}
          </div>
          {logsThisWeek.length === 0 ? (
            <p className="text-body text-text-secondary">
              Nenhuma atividade esta semana. Seus alunos verão aqui quando
              começarem a treinar.
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
          {lowAdherence.length > 0 && (
            <Card variant="default" className="border border-warning/30">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle
                  size={18}
                  className="text-warning"
                  aria-hidden
                />
                <h3 className="text-h3 text-text-primary">Baixa aderência</h3>
              </div>
              <ul className="flex flex-col gap-2">
                {lowAdherence.map((s) => (
                  <li
                    key={s.user.id}
                    className="flex items-center justify-between gap-2"
                  >
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
                    <Badge variant="erro">{s.adherence}%</Badge>
                  </li>
                ))}
              </ul>
              <LinkButton
                variant="tertiary"
                size="md"
                href="/alunos"
                className="mt-3"
              >
                Ver detalhes →
              </LinkButton>
            </Card>
          )}

          {plans.length > 0 ? (
            <Card variant="default">
              <h3 className="text-h3 text-text-primary mb-3">Planos ativos</h3>
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
                          {link?.student.name ?? "—"}
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
                Ver tudo →
              </LinkButton>
            </Card>
          ) : (
            <Card variant="default">
              <EmptyState
                icon={Dumbbell}
                title="Sem planos ativos"
                description="Crie um plano de treino para um aluno."
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
