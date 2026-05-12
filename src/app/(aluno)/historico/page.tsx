import { PageHeader } from "@/components/shared/PageHeader";
import { HistoricoClient } from "@/components/aluno/HistoricoClient";
import { requireRole } from "@/lib/auth-helpers";
import { getMyHistory } from "@/lib/actions/workout-logs";
import type { WorkoutStatus } from "@/components/shared/StatusBadge";

export default async function HistoricoPage() {
  await requireRole("ALUNO");
  const raw = await getMyHistory(120);

  const logs = raw.map((l) => {
    const totalVolumeKg = Math.round(
      l.exerciseLogs.reduce(
        (acc, el) =>
          acc +
          (el.completed && el.weight && el.reps ? el.weight * el.reps : 0),
        0,
      ),
    );
    const durationSeconds = l.finishedAt
      ? Math.round((l.finishedAt.getTime() - l.startedAt.getTime()) / 1000)
      : undefined;
    const status: WorkoutStatus =
      l.status === "COMPLETED"
        ? "concluido"
        : l.status === "ABANDONED"
          ? "pulado"
          : "em_andamento";
    return {
      id: l.id,
      dateIso: l.startedAt.toISOString(),
      sessionLetter: l.session.name.charAt(0) || "T",
      sessionName: l.session.name,
      status,
      durationSeconds,
      totalVolumeKg,
    };
  });

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Histórico de treinos"
        subtitle="Tudo que você já registrou"
      />
      <HistoricoClient logs={logs} />
    </div>
  );
}
