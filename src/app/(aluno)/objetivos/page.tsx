import { PageHeader } from "@/components/shared/PageHeader";
import { ObjetivosClient } from "@/components/aluno/ObjetivosClient";
import { requireRole } from "@/lib/auth-helpers";
import { listMyGoals } from "@/lib/actions/goals";
import { prisma } from "@/lib/prisma";

export default async function ObjetivosPage() {
  const user = await requireRole("ALUNO");

  // Pull the goals + the user's sportsPracticed in parallel so the dialog
  // can offer only the sports the user actually selected on their profile.
  const [goals, profile] = await Promise.all([
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
      <ObjetivosClient
        initialGoals={goals}
        availableSports={availableSports}
      />
    </div>
  );
}
