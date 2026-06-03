import { PageHeader } from "@/components/shared/PageHeader";
import { NutriAlunosClient } from "@/components/nutri/NutriAlunosClient";
import { requireNutricionista } from "@/lib/auth-helpers";
import {
  getMyAlunosNutri,
  listMyNutriInvites,
} from "@/lib/actions/nutri-invites";

export default async function NutriAlunosPage() {
  await requireNutricionista();
  const [alunos, invites] = await Promise.all([
    getMyAlunosNutri(),
    listMyNutriInvites(),
  ]);

  const students = alunos.map((a) => ({
    linkId: a.linkId,
    id: a.student.id,
    name: a.student.name,
    email: a.student.email,
    avatarUrl: a.student.avatarUrl,
    startedAt: a.startedAt.toISOString().slice(0, 10),
  }));

  const inviteRows = invites.map((i) => ({
    id: i.id,
    code: i.code,
    status: i.status as "ACTIVE" | "USED" | "EXPIRED" | "REVOKED",
    expiresAt: i.expiresAt.toISOString().slice(0, 10),
    createdAt: i.createdAt.toISOString().slice(0, 10),
  }));

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Alunos"
        subtitle={`${students.length} ${
          students.length === 1 ? "aluno vinculado" : "alunos vinculados"
        }`}
      />
      <NutriAlunosClient students={students} invites={inviteRows} />
    </div>
  );
}
