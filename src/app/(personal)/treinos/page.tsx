import Link from "next/link";
import { Plus, Target } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AvatarStack } from "@/components/ui/Avatar";
import { LinkButton } from "@/components/ui/LinkButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { requireRole } from "@/lib/auth-helpers";
import { getMyPlans } from "@/lib/actions/workout-plans";
import { prisma } from "@/lib/prisma";
import { formatLongDate } from "@/lib/date";

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

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Treinos"
        subtitle={`${plans.length} ${plans.length === 1 ? "plano cadastrado" : "planos cadastrados"}`}
        actions={
          <LinkButton href="/treinos/novo" variant="primary" size="md">
            <Plus size={18} aria-hidden /> Criar plano
          </LinkButton>
        }
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhum plano criado"
          description="Crie seu primeiro plano de treino e prescreva exercícios para um aluno."
          action={
            <LinkButton href="/treinos/novo" variant="primary" size="md">
              <Plus size={16} aria-hidden /> Criar plano
            </LinkButton>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {plans.map((p) => {
            const student = studentById.get(p.studentId);
            return (
              <Link key={p.id} href={`/treinos/${p.id}`}>
                <Card variant="interactive">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge>{p.sessions.length}x semana</Badge>
                        {p.isActive && (
                          <Badge variant="concluido">Ativo</Badge>
                        )}
                      </div>
                      <p className="text-h3 text-text-primary truncate">
                        {p.name}
                      </p>
                      <p className="text-caption text-text-muted truncate">
                        {student?.name ?? "-"} ·{" "}
                        {formatLongDate(p.startDate.toISOString())}
                        {p.endDate
                          ? ` - ${formatLongDate(p.endDate.toISOString())}`
                          : ""}
                      </p>
                    </div>
                    {student && (
                      <AvatarStack
                        users={[
                          {
                            name: student.name,
                            src: student.avatarUrl ?? undefined,
                          },
                        ]}
                      />
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
