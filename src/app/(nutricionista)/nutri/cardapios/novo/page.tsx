import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { requireNutricionista } from "@/lib/auth-helpers";
import {
  getAlunosWithLink,
} from "@/lib/actions/nutri-meal-plans";
import { listFoods } from "@/lib/actions/nutri-foods";
import { MealPlanBuilder } from "@/components/nutri/MealPlanBuilder";
import { Users } from "lucide-react";

export default async function NutriCardapioNovoPage() {
  await requireNutricionista();
  const [alunos, foods] = await Promise.all([
    getAlunosWithLink(),
    listFoods(500),
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <header className="flex items-center gap-3 mb-4">
        <Link href="/nutri/cardapios">
          <IconButton aria-label="Voltar">
            <ChevronLeft size={20} />
          </IconButton>
        </Link>
      </header>

      <PageHeader
        title="Novo cardápio"
        subtitle="Selecione o aluno, defina as refeições e adicione alimentos."
      />

      {alunos.length === 0 ? (
        <Card variant="default">
          <EmptyState
            icon={Users}
            title="Nenhum aluno vinculado"
            description="Você precisa de pelo menos um aluno vinculado pra criar um cardápio. Vai em Alunos e gere um código de convite."
          />
        </Card>
      ) : (
        <MealPlanBuilder alunos={alunos} foods={foods} />
      )}
    </div>
  );
}
