import { Database } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ObjetivosClient } from "@/components/aluno/ObjetivosClient";
import { HeroCard } from "@/components/visual/HeroCard";
import { requireRole } from "@/lib/auth-helpers";
import { listMyGoals } from "@/lib/actions/goals";
import { prisma } from "@/lib/prisma";

export default async function ObjetivosPage() {
  const user = await requireRole("ALUNO");

  const [goalsResult, profile] = await Promise.all([
    listMyGoals(),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { sportsPracticed: true },
    }),
  ]);

  const availableSports = Array.isArray(profile?.sportsPracticed)
    ? (profile!.sportsPracticed as string[])
    : [];

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Objetivos"
        subtitle="Defina metas pelos esportes que você pratica e acompanhe o progresso."
      />

      {goalsResult.schemaMissing ? (
        // The Goal table doesn't exist yet — show a precise message instead
        // of letting the page crash. Disappears as soon as the migration runs.
        <HeroCard className="p-6 flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-warning/15 border border-warning/40 text-warning flex items-center justify-center shrink-0">
            <Database size={18} aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-stat-label uppercase text-warning">
              Banco desatualizado
            </p>
            <h2 className="mt-2 text-h3 text-text-primary">
              Objetivos ainda não estão disponíveis
            </h2>
            <p className="mt-2 text-body text-text-secondary leading-relaxed">
              A tabela de metas ainda precisa ser criada no banco. Aplique a
              migration{" "}
              <code className="font-mono text-accent">
                20260517_add_goals
              </code>{" "}
              e essa tela já fica funcional.
            </p>
          </div>
        </HeroCard>
      ) : (
        <ObjetivosClient
          initialGoals={goalsResult.goals}
          availableSports={availableSports}
        />
      )}
    </div>
  );
}
