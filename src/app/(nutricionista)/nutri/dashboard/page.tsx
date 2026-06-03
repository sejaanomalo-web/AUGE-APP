import { Users, Utensils, Wheat, MessageSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireNutricionista } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";

export default async function NutriDashboardPage() {
  const me = await requireNutricionista();

  const [alunosCount, cardapiosCount] = await Promise.all([
    prisma.nutritionistStudent.count({
      where: { nutritionistId: me.id, status: "ACTIVE" },
    }),
    prisma.mealPlan.count({
      where: { nutritionistId: me.id, isActive: true },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title={`Olá, ${me.name.split(" ")[0]}`}
        subtitle="Painel do nutricionista"
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard
          icon={<Users size={20} aria-hidden />}
          label="Alunos ativos"
          value={alunosCount}
        />
        <StatCard
          icon={<Utensils size={20} aria-hidden />}
          label="Cardápios ativos"
          value={cardapiosCount}
        />
        <StatCard
          icon={<Wheat size={20} aria-hidden />}
          label="Aderência média"
          value="—"
          hint="Disponível quando alunos começarem a logar refeições"
        />
        <StatCard
          icon={<MessageSquare size={20} aria-hidden />}
          label="Follow-ups"
          value="—"
          hint="Em breve"
        />
      </section>

      {alunosCount === 0 && (
        <Card variant="default">
          <EmptyState
            icon={Users}
            title="Nenhum aluno vinculado ainda"
            description="Convide alunos pelo seu código de convite na aba Alunos. Eles vão te ver no perfil deles e poder acompanhar o cardápio que você prescrever."
          />
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card variant="default" className="flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2 text-text-secondary">
        <span className="text-accent" aria-hidden>
          {icon}
        </span>
        <p className="text-caption truncate">{label}</p>
      </div>
      <p className="text-h2 text-text-primary tnum">{value}</p>
      {hint && <p className="text-caption text-text-muted">{hint}</p>}
    </Card>
  );
}
