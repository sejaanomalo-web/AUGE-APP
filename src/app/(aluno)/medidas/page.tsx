import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { MedidasView } from "@/components/aluno/MedidasView";
import { requireRole } from "@/lib/auth-helpers";
import { getMyMetrics } from "@/lib/actions/body-metrics";
import { listMyExams } from "@/lib/actions/exams";

export default async function MedidasPage() {
  await requireRole("ALUNO");
  const [rawMetrics, rawExams] = await Promise.all([
    getMyMetrics(),
    listMyExams(),
  ]);

  const metrics = rawMetrics.map((m) => {
    const measurements = (m.measurements as Record<string, number> | null) ?? {};
    return {
      id: m.id,
      date: m.date.toISOString().slice(0, 10),
      weight: m.weight,
      bodyFat: m.bodyFat,
      waist: measurements.waist ?? null,
      arm: measurements.arm ?? null,
      thigh: measurements.thigh ?? null,
    };
  });

  const exams = rawExams.map((e) => ({
    id: e.id,
    date: e.date.toISOString().slice(0, 10),
    type: e.type,
    fileName: e.fileName,
  }));

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Medidas"
        subtitle="Acompanhe sua evolução corporal"
        actions={
          <LinkButton href="/medidas/novo" variant="primary" size="md">
            <Plus size={18} aria-hidden /> Nova medida
          </LinkButton>
        }
      />
      <MedidasView metrics={metrics} exams={exams} />
    </div>
  );
}
