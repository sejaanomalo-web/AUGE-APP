import Link from "next/link";
import { Plus, Utensils } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { requireNutricionista } from "@/lib/auth-helpers";
import { getMyMealPlans } from "@/lib/actions/nutri-meal-plans";
import { NutriCardapiosList } from "@/components/nutri/NutriCardapiosList";

export default async function NutriCardapiosPage() {
  await requireNutricionista();
  const plans = await getMyMealPlans();

  const rows = plans.map((p) => ({
    id: p.id,
    name: p.name,
    studentName: p.student.name,
    studentAvatarUrl: p.student.avatarUrl,
    startDate: p.startDate.toISOString().slice(0, 10),
    endDate: p.endDate?.toISOString().slice(0, 10) ?? null,
    mealCount: p.meals.length,
    isActive: p.isActive,
    isPaused: p.pausedAt !== null,
    targetCalories: p.targetCalories,
  }));

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Cardápios"
        subtitle={`${rows.length} ${
          rows.length === 1 ? "cardápio" : "cardápios"
        }`}
        actions={
          <Link href="/nutri/cardapios/novo">
            <Button variant="primary" size="md">
              <Plus size={16} aria-hidden /> Novo cardápio
            </Button>
          </Link>
        }
      />

      {rows.length === 0 ? (
        <Card variant="default">
          <EmptyState
            icon={Utensils}
            title="Nenhum cardápio criado"
            description="Crie seu primeiro cardápio para um aluno vinculado. Você pode definir refeições, alimentos e metas de macros."
            action={
              <Link href="/nutri/cardapios/novo">
                <Button variant="primary" size="md">
                  <Plus size={16} aria-hidden /> Novo cardápio
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <NutriCardapiosList rows={rows} />
      )}
    </div>
  );
}
