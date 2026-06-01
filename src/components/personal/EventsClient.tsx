"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, CalendarDays, MapPin } from "lucide-react";
import type { EventType } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { EventForm, type EventFormStudent } from "./EventForm";
import type { EventWithStudent } from "@/lib/actions/events";

const TYPE_LABELS: Record<EventType, string> = {
  RUN_RACE: "Corrida",
  COMPETITION: "Competição",
  ONE_OFF_SESSION: "Sessão",
  EVALUATION: "Avaliação",
  OTHER: "Outro",
};

const TYPE_VARIANT: Record<
  EventType,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  RUN_RACE: "intensity",
  COMPETITION: "coach",
  ONE_OFF_SESSION: "info",
  EVALUATION: "warning",
  OTHER: "default",
};

function formatBR(iso: string) {
  const d = new Date(iso);
  const dt = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return dt;
}

export function EventsClient({
  events,
  students,
}: {
  events: EventWithStudent[];
  students: EventFormStudent[];
}) {
  const [createOpen, setCreateOpen] = React.useState(false);

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.startsAt).getTime() >= now);
  const past = events
    .filter((e) => new Date(e.startsAt).getTime() < now)
    .slice()
    .reverse();

  return (
    <>
      <Tabs defaultValue="upcoming">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="upcoming">
              Próximos ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past">Passados ({past.length})</TabsTrigger>
          </TabsList>
          <Button
            variant="primary"
            size="md"
            onClick={() => setCreateOpen(true)}
            className="shrink-0"
          >
            <Plus size={18} aria-hidden /> Novo evento
          </Button>
        </div>

        <TabsContent value="upcoming" className="mt-4">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nenhum evento futuro"
              description="Cadastre corridas, competições, sessões avulsas e avaliações pra receber lembretes automáticos."
              action={
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus size={16} aria-hidden /> Novo evento
                </Button>
              }
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {upcoming.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {past.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nenhum evento passado"
              description="Os eventos já realizados aparecem aqui."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {past.map((e) => (
                <EventCard key={e.id} event={e} muted />
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      {createOpen && (
        <EventForm
          open={createOpen}
          onOpenChange={setCreateOpen}
          students={students}
        />
      )}
    </>
  );
}

function EventCard({
  event,
  muted,
}: {
  event: EventWithStudent;
  muted?: boolean;
}) {
  return (
    <li>
      <Link href={`/eventos/${event.id}`} className="block">
        <Card variant="interactive" className={muted ? "opacity-75" : ""}>
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant={TYPE_VARIANT[event.type]}>
                  {TYPE_LABELS[event.type]}
                </Badge>
                <span className="text-caption text-text-muted tnum">
                  {formatBR(event.startsAt)}
                </span>
              </div>
              <p className="text-h3 text-text-primary truncate">
                {event.title}
              </p>
              <p className="text-caption text-text-muted truncate">
                {event.studentName ?? "Evento pessoal"}
                {event.location ? ` · ${event.location}` : ""}
              </p>
            </div>
            {event.location && (
              <MapPin
                size={18}
                aria-hidden
                className="text-text-muted shrink-0 mt-1"
              />
            )}
          </div>
        </Card>
      </Link>
    </li>
  );
}
