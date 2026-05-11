import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronLeft, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import {
  StatusBadge,
  type WorkoutStatus,
} from "@/components/shared/StatusBadge";
import { logsById, workoutLogs } from "@/lib/mock-data";
import { formatLongDate, capitalize } from "@/lib/date";
import { formatDuration } from "@/lib/utils";

function findPrevSameSession(
  templateId: string,
  beforeDate: string,
): (typeof workoutLogs)[number] | undefined {
  return workoutLogs
    .filter(
      (l) =>
        l.sessionTemplateId === templateId &&
        l.date < beforeDate &&
        l.status === "concluido",
    )
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

export default async function HistoricoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const log = logsById.get(id);
  if (!log) return notFound();
  const prev = findPrevSameSession(log.sessionTemplateId, log.date);
  const volumeDeltaPct =
    prev && prev.totalVolumeKg && log.totalVolumeKg
      ? ((log.totalVolumeKg - prev.totalVolumeKg) / prev.totalVolumeKg) * 100
      : null;

  const totalSets = log.exercises.reduce(
    (a, e) => a + (e.prescribedSets ?? 0),
    0,
  );
  const completedSets = log.exercises.reduce(
    (a, e) => a + e.sets.filter((s) => s.completed).length,
    0,
  );
  const completionPct =
    totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100);

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
            <Badge>Treino {log.sessionLetter}</Badge>
            <StatusBadge status={log.status as WorkoutStatus} />
          </div>
          <h1 className="text-h1 text-text-primary truncate">
            {log.sessionName}
          </h1>
          <p className="text-caption text-text-secondary">
            {capitalize(formatLongDate(log.date))}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-bg-surface rounded-lg p-3">
          <p className="text-caption text-text-muted">Tempo</p>
          <p className="text-h3 text-text-primary tnum">
            {log.durationSeconds ? formatDuration(log.durationSeconds) : "—"}
          </p>
        </div>
        <div className="bg-bg-surface rounded-lg p-3">
          <p className="text-caption text-text-muted">Volume</p>
          <p className="text-h3 text-text-primary tnum">
            {log.totalVolumeKg
              ? `${log.totalVolumeKg.toLocaleString("pt-BR")} kg`
              : "—"}
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
        <div className="bg-bg-surface rounded-lg p-3">
          <p className="text-caption text-text-muted">Conclusão</p>
          <p className="text-h3 text-text-primary tnum">{completionPct}%</p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        {log.exercises.map((ex) => (
          <Card key={ex.prescribedExerciseId} variant="default">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-body-lg font-semibold text-text-primary truncate">
                  {ex.exerciseName}
                </p>
                <p className="text-caption text-text-secondary tnum">
                  Prescrito: {ex.prescribedSets} × {ex.prescribedReps}
                </p>
              </div>
              <Badge variant={ex.skipped ? "pulado" : "concluido"}>
                {ex.skipped ? "Pulado" : "Feito"}
              </Badge>
            </div>
            {ex.skipped && ex.skipReason ? (
              <p className="text-caption text-text-muted italic">
                Motivo: {ex.skipReason}
              </p>
            ) : ex.sets.length === 0 ? (
              <p className="text-caption text-text-muted">
                Nenhuma série registrada.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {ex.sets.map((s) => (
                  <li
                    key={s.setNumber}
                    className="flex items-center gap-3 text-body tnum"
                  >
                    <span className="w-6 h-6 rounded-full bg-bg-elevated text-text-secondary text-caption font-bold flex items-center justify-center shrink-0">
                      {s.setNumber}
                    </span>
                    <span className="flex-1 text-text-primary">
                      {s.weightKg.toFixed(s.weightKg % 1 === 0 ? 0 : 1)} kg ×{" "}
                      {s.reps}
                    </span>
                    {s.completed ? (
                      <Check size={16} className="text-success" aria-hidden />
                    ) : (
                      <X size={16} className="text-error" aria-hidden />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </section>
    </div>
  );
}
