import { PageHeader } from "@/components/shared/PageHeader";
import { AlunosClient } from "@/components/personal/AlunosClient";
import { requireRole } from "@/lib/auth-helpers";
import { getMyStudents } from "@/lib/actions/students";
import { listMyInvites } from "@/lib/actions/invites";
import { prisma } from "@/lib/prisma";

export default async function AlunosPage() {
  await requireRole("PERSONAL");
  const [links, invites] = await Promise.all([
    getMyStudents(),
    listMyInvites(),
  ]);

  // Active plan per student
  const studentIds = links.map((l) => l.studentId);
  const activePlans = studentIds.length
    ? await prisma.workoutPlan.findMany({
        where: { studentId: { in: studentIds }, isActive: true },
        select: { studentId: true, name: true },
      })
    : [];
  const planByStudent = new Map(activePlans.map((p) => [p.studentId, p.name]));

  const students = links.map((l) => ({
    id: l.studentId,
    name: l.student.name,
    email: l.student.email,
    avatarUrl: l.student.avatarUrl,
    status: l.status as "ACTIVE" | "PAUSED",
    startedAt: l.startedAt.toISOString().slice(0, 10),
    activePlanName: planByStudent.get(l.studentId) ?? null,
  }));

  const inviteRows = invites.map((i) => ({
    id: i.id,
    code: i.code,
    status: i.status as "ACTIVE" | "USED" | "EXPIRED" | "REVOKED",
    expiresAt: i.expiresAt.toISOString().slice(0, 10),
    createdAt: i.createdAt.toISOString().slice(0, 10),
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Alunos"
        subtitle={`${students.length} ${students.length === 1 ? "aluno vinculado" : "alunos vinculados"}`}
      />
      <AlunosClient students={students} invites={inviteRows} />
    </div>
  );
}
