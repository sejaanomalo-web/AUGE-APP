import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  TreinosClient,
  type TreinoCardData,
} from "@/components/personal/TreinosClient";
import { requireRole } from "@/lib/auth-helpers";
import { getMyPlans, type PlanStatus } from "@/lib/actions/workout-plans";
import { prisma } from "@/lib/prisma";

function derivePlanStatus(plan: {
  isActive: boolean;
  pausedAt: Date | null;
}): PlanStatus {
  if (!plan.isActive) return "INACTIVE";
  if (plan.pausedAt) return "PAUSED";
  return "ACTIVE";
}

export default async function TreinosPage() {
  await requireRole("PERSONAL");
  const plans = await getMyPlans();

  const studentIds = [...new Set(plans.map((p) => p.studentId))];
  const students = studentIds.length
    ? await prisma.user.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, name: true, avatarUrl: true },
      })
    : [];
  const studentById = new Map(students.map((s) => [s.id, s]));

  const cards: TreinoCardData[] = plans.map((p) => {
    const student = studentById.get(p.studentId);
    return {
      id: p.id,
      name: p.name,
      studentId: p.studentId,
      studentName: student?.name ?? "Aluno removido",
      studentAvatarUrl: student?.avatarUrl ?? null,
      sessionsCount: p.sessions.length,
      startDateIso: p.startDate.toISOString(),
      endDateIso: p.endDate ? p.endDate.toISOString() : null,
      status: derivePlanStatus(p),
    };
  });

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Treinos"
        subtitle={`${plans.length} ${
          plans.length === 1 ? "plano cadastrado" : "planos cadastrados"
        }`}
        actions={
          <LinkButton href="/treinos/novo" variant="primary" size="md">
            <Plus size={18} aria-hidden /> Criar plano
          </LinkButton>
        }
      />
      <TreinosClient plans={cards} />
    </div>
  );
}
