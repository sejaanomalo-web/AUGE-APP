import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AvatarStack } from "@/components/ui/Avatar";
import { LinkButton } from "@/components/ui/LinkButton";
import { alunosSummary, personalPlans, activePlan } from "@/lib/mock-data";
import { formatLongDate } from "@/lib/date";
import Link from "next/link";

export default function TreinosPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Treinos"
        subtitle={`${personalPlans.length} planos cadastrados`}
        actions={
          <LinkButton href="/treinos/novo" variant="primary" size="md">
            <Plus size={18} aria-hidden /> Criar plano
          </LinkButton>
        }
      />

      <div className="flex flex-col gap-3">
        {personalPlans.map((p) => {
          const aluno = alunosSummary.find((s) => s.user.name === p.aluno);
          const planMeta =
            p.id === activePlan.id
              ? `${formatLongDate(activePlan.startDate)} – ${formatLongDate(activePlan.endDate)}`
              : "Em andamento";
          return (
            <Link key={p.id} href={`/treinos/${p.id}`}>
              <Card variant="interactive">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge>{p.weeklyFrequency}x semana</Badge>
                      <Badge variant="concluido">Ativo</Badge>
                    </div>
                    <p className="text-h3 text-text-primary truncate">
                      {p.name}
                    </p>
                    <p className="text-caption text-text-muted truncate">
                      {p.aluno} · {planMeta}
                    </p>
                  </div>
                  {aluno && (
                    <AvatarStack
                      users={[
                        { name: aluno.user.name, src: aluno.user.avatar },
                      ]}
                    />
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
