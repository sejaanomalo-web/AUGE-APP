import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";

export default function NutriAlunosPlaceholder() {
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Alunos" subtitle="Gerencie seus alunos vinculados" />
      <Card variant="default">
        <EmptyState
          icon={Users}
          title="Em construção"
          description="A lista de alunos e o fluxo de convite estarão disponíveis na próxima atualização."
        />
      </Card>
    </div>
  );
}
