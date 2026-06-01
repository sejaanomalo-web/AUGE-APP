import { notFound } from "next/navigation";
import { EventForm } from "@/components/personal/EventForm";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function EditarEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("PERSONAL");
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.trainerId !== user.id) notFound();

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
      initial={{
        id: event.id,
        title: event.title,
        type: event.type,
        startsAt: event.startsAt.toISOString(),
        durationMinutes: event.durationMinutes,
        location: event.location,
        locationUrl: event.locationUrl,
        notes: event.notes,
        studentId: event.studentId,
      }}
      redirectOnSave="/eventos"
    />
  );
}
