import { PageHeader } from "@/components/shared/PageHeader";
import { EventsClient } from "@/components/personal/EventsClient";
import { requireRole } from "@/lib/auth-helpers";
import { listMyEvents } from "@/lib/actions/events";
import { prisma } from "@/lib/prisma";

export default async function EventosPage() {
  const user = await requireRole("PERSONAL");
  const events = await listMyEvents();
  const links = await prisma.trainerStudent.findMany({
    where: { trainerId: user.id, status: { in: ["ACTIVE", "PAUSED"] } },
    include: { student: { select: { id: true, name: true } } },
  });
  const students = links
    .map((l) => ({ id: l.student.id, name: l.student.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Eventos"
        subtitle="Agenda com lembretes automáticos 24h e 2h antes."
      />
      <EventsClient events={events} students={students} />
    </div>
  );
}
