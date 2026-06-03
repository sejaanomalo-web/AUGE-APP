import { Wheat } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";

export default function NutriAlimentosPlaceholder() {
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Alimentos"
        subtitle="Catálogo de alimentos TACO e seus alimentos personalizados"
      />
      <Card variant="default">
        <EmptyState
          icon={Wheat}
          title="Em construção"
          description="O catálogo de alimentos com busca estará disponível na próxima atualização."
        />
      </Card>
    </div>
  );
}
