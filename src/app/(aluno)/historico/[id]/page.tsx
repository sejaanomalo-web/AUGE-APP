import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronLeft, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { requireRole } from "@/lib/auth-helpers";
import { getWorkoutLogById } from "@/lib/actions/workout-logs";
import { prisma } from "@/lib/prisma";
import { formatLongDate, capitalize } from "@/lib/date";
import { formatDuration } from "@/lib/utils";

export default async function HistoricoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ALUNO");
  const { id } = await params;
  const log = await getWorkoutLogById(id);
  if (!log) return notFound();

  const totalVolume = log.exerciseLogs.reduce(
    (acc, el) =>
      acc +
      (el.completed && el.weight && el.reps ? el.weight * el.reps : 0),
    0,
  );
  const completedSets = log.exerciseLogs.filter(
    (el) => el.completed,
  ).length;
  const prescribedSets = log.session.exercises.reduce(
    (a, p) => a + p.sets,
    0,
  );
  const completionPct =
    prescribedSets === 0
      ? 0
      : Math.round((completedSets / prescribedSets) * 100);
  const durationSeconds = log.finishedAt
    ? Math.round((log.finishedAt.getTime() - log.startedAt.getTime()) / 1000)
    : null;

  // Compare with previous completed log of same session
  const prev = await prisma.workoutLog.findFirst({
    where: {
      sessionId: log.sessionId,
      studentId: log.studentId,
      status: "COMPLETED",
      startedAt: { lt: log.startedAt },
    },
    include: { exerciseLogs: true },
    orderBy: { startedAt: "desc" },
  });
  const prevVolume = prev
    ? prev.exerciseLogs.reduce(
        (a, el) =>
          a +
          (el.completed && el.weight && el.reps ? el.weight * el.reps : 0),
        0,
      )
    : null;
  const volumeDeltaPct =
    prevVolume && prevVolume > 0
      ? ((totalVolume - prevVolume) / prevVolume) * 100
      : null;

  const status =
    log.status === "COMPLETED"
      ? "concluido"
      : log.status === "ABANDONED"
        ? "pulado"
        : "em_andamento";

  return (
    <div className="max-w-3xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/historico">
          <IconButton aria-label="Voltar">
            <ChevronLeft size={20} />
          </IconButton>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge>{log.session.plan.name}</Badge>
            <StatusBadge status={status} />
          </div>
          <h1 className="text-h1 text-text-primary truncate">
            {log.session.name}
          </h1>
          <p className="text-caption text-text-secondary">
            {capitalize(
              formatLongDate(log.startedAt.toISOString().slice(0, 10)),
            )}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-bg-surface rounded-md p-3">
          <p className="text-caption text-text-muted">Tempo</p>
          <p className="text-h3 text-text-primary tnum">
            {durationSeconds ? formatDuration(durationSeconds) : "-"}
          </p>
        </div>
        <div className="bg-bg-surface rounded-md p-3">
          <p className="text-caption text-text-muted">Volume</p>
          <p className="text-h3 text-text-primary tnum">
            {totalVolume > 0
              ? `${Math.round(totalVolume).toLocaleString("pt-BR")} kg`
              : "-"}
          </p>
          {volumeDeltaPct !== null && (
            <p
              className={`text-caption tnum mt-0.5 ${
                volumeDeltaPct >= 0 ? "text-success" : "text-error"
              }`}
            >
              {volumeDeltaPct >= 0 ? "+" : ""}
              {volumeDeltaPct.toFixed(1)}% vs anterior
            </p>
          )}
        </div>
        <div className="bg-bg-surface rounded-md p-3">
          <p className="text-caption text-text-muted">Conclusão</p>
          <p className="text-h3 text-text-primary tnum">{completionPct}%</p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        {log.session.exercises.map((p) => {
          const sets = log.exerciseLogs
            .filter(
              (el) => el.exerciseId === p.exerciseId && el.setNumber > 0,
            )
            .sort((a, b) => a.setNumber - b.setNumber);
          const skipMarker = log.exerciseLogs.find(
            (el) => el.exerciseId === p.exerciseId && el.skipped,
          );
          return (
            <Card key={p.id} variant="default">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-body-lg font-semibold text-text-primary truncate">
                    {p.exercise.name}
                  </p>
                  <p className="text-caption text-text-secondary tnum">
                    Prescrito: {p.sets} × {p.reps}
                  </p>
                </div>
                <Badge variant={skipMarker ? "pulado" : "concluido"}>
                  {skipMarker ? "Pulado" : "Feito"}
                </Badge>
              </div>
              {skipMarker?.skippedReason ? (
                <p className="text-caption text-text-muted italic">
                  Motivo: {skipMarker.skippedReason}
                </p>
              ) : sets.length === 0 ? (
                <p className="text-caption text-text-muted">
                  Nenhuma série registrada.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {sets.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center gap-3 text-body tnum"
                    >
                      <span className="w-6 h-6 rounded-full bg-bg-elevated text-text-secondary text-caption font-bold flex items-center justify-center shrink-0">
                        {s.setNumber}
                      </span>
                      <span className="flex-1 text-text-primary">
                        {(s.weight ?? 0).toFixed(
                          (s.weight ?? 0) % 1 === 0 ? 0 : 1,
                        )}{" "}
                        kg × {s.reps ?? 0}
                      </span>
                      {s.completed ? (
                        <Check
                          size={16}
                          className="text-success"
                          aria-hidden
                        />
                      ) : (
                        <X size={16} className="text-error" aria-hidden />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </section>
    </div>
  );
}
