import { TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth-helpers";

export default async function NutricaoEvolucaoPage() {
  await requireRole("ALUNO");
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Evolução" subtitle="Acompanhamento nutricional" />
      <Card variant="default">
        <EmptyState
          icon={TrendingUp}
          title="Em construção"
          description="Gráficos de aderência, calorias diárias e progresso nutricional virão em breve."
        />
      </Card>
    </div>
  );
}
