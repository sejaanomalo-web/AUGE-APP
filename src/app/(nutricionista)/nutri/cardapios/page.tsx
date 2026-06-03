import { Utensils } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";

export default function NutriCardapiosPlaceholder() {
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Cardápios"
        subtitle="Crie e acompanhe os planos alimentares dos seus alunos"
      />
      <Card variant="default">
        <EmptyState
          icon={Utensils}
          title="Em construção"
          description="O editor de cardápios estará disponível na próxima atualização."
        />
      </Card>
    </div>
  );
}
