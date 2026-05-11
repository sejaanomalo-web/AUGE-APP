import Link from "next/link";
import {
  AlertTriangle,
  ChevronRight,
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
import { StatusDot } from "@/components/ui/StatusDot";
import { capitalize, formatDayMonth, formatRelativeFromNow } from "@/lib/date";
import {
  activityEvents,
  alunosSummary,
  NOW_ISO,
  personal,
  personalPlans,
  TODAY_ISO,
} from "@/lib/mock-data";

export default function DashboardPersonalPage() {
  const lowAdherence = alunosSummary.filter((s) => s.aderencia < 70);
  const treinosHoje = activityEvents.filter(
    (e) =>
      e.timestamp.startsWith(TODAY_ISO) &&
      (e.type === "workout_finished" || e.type === "workout_started"),
  );
  const finalizadosHoje = treinosHoje.filter(
    (e) => e.type === "workout_finished",
  ).length;
  const andamentoHoje = treinosHoje.filter(
    (e) => e.type === "workout_started",
  ).length;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <section>
        <h1 className="text-h1 text-text-primary">
          Bom dia, {personal.name.split(" ")[0]} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1 text-body-lg text-text-secondary">
          {capitalize(formatDayMonth(TODAY_ISO))}
        </p>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Alunos ativos"
          value={alunosSummary.length}
          icon={Users}
        />
        <StatCard
          label="Treinos hoje"
          value={treinosHoje.length}
          hint={`${finalizadosHoje} finalizado · ${andamentoHoje} em andamento`}
          icon={Dumbbell}
        />
        <StatCard label="Treinos da semana" value={12} icon={TrendingUp} />
        <StatCard
          label="Aderência média"
          value={`${Math.round(alunosSummary.reduce((a, s) => a + s.aderencia, 0) / alunosSummary.length)}%`}
          icon={Target}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card variant="default" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 text-text-primary">Atividade recente</h2>
            <Badge>{activityEvents.length}</Badge>
          </div>
          <ul className="flex flex-col">
            {activityEvents.map((ev, i) => (
              <li
                key={ev.id}
                className={`py-3 flex items-start gap-3 ${
                  i !== activityEvents.length - 1
                    ? "border-b border-border-subtle"
                    : ""
                }`}
              >
                <Avatar
                  name={ev.studentName}
                  src={alunosSummary.find((s) => s.user.id === ev.studentId)?.user
                    .avatar}
                  size={36}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-body text-text-primary">
                    <span className="font-semibold">{ev.studentName}</span>{" "}
                    <span className="text-text-secondary">{ev.message}</span>
                  </p>
                  <p className="text-caption text-text-muted mt-0.5 inline-flex items-center gap-2">
                    <StatusDot
                      status={
                        ev.type === "workout_finished"
                          ? "concluido"
                          : ev.type === "workout_started"
                            ? "em_andamento"
                            : ev.type === "workout_skipped"
                              ? "pulado"
                              : "nao_iniciado"
                      }
                    />
                    {formatRelativeFromNow(ev.timestamp, NOW_ISO)}
                  </p>
                </div>
                {ev.link && (
                  <Link
                    href={ev.link}
                    aria-label="Ver detalhes"
                    className="text-text-muted hover:text-text-primary"
                  >
                    <ChevronRight size={18} aria-hidden />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex flex-col gap-4">
          {lowAdherence.length > 0 && (
            <Card variant="default" className="border border-warning/30">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={18} className="text-warning" aria-hidden />
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
                        src={s.user.avatar}
                        size={28}
                      />
                      <span className="text-body text-text-primary truncate">
                        {s.user.name}
                      </span>
                    </Link>
                    <Badge variant="erro">{s.aderencia}%</Badge>
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

          <Card variant="default">
            <h3 className="text-h3 text-text-primary mb-3">Planos ativos</h3>
            <ul className="flex flex-col gap-2">
              {personalPlans.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-body text-text-primary truncate">
                      {p.name}
                    </p>
                    <p className="text-caption text-text-muted truncate">
                      {p.aluno}
                    </p>
                  </div>
                  <Badge>{p.weeklyFrequency}x</Badge>
                </li>
              ))}
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
        </div>
      </section>
    </div>
  );
}
