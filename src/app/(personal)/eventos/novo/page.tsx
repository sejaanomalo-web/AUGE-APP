import { EventForm } from "@/components/personal/EventForm";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function NovoEventoPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const user = await requireRole("PERSONAL");
  const sp = await searchParams;
  const links = await prisma.trainerStudent.findMany({
    where: { trainerId: user.id, status: { in: ["ACTIVE", "PAUSED"] } },
    include: { student: { select: { id: true, name: true } } },
  });
  const students = links
    .map((l) => ({ id: l.student.id, name: l.student.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <EventForm
      students={students}
      initial={{ studentId: sp.studentId ?? null }}
      redirectOnSave="/eventos"
    />
  );
}
