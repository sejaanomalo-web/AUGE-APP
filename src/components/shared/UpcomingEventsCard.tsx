import { CalendarDays, MapPin } from "lucide-react";
import type { EventType } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "./EmptyState";
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
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function UpcomingEventsCard({
  events,
}: {
  events: EventWithStudent[];
}) {
  if (events.length === 0) {
    return (
      <Card variant="default">
        <EmptyState
          icon={CalendarDays}
          title="Sem eventos no horizonte"
          description="Quando seu personal cadastrar uma corrida, avaliação ou competição, ela aparece aqui."
          className="py-8"
        />
      </Card>
    );
  }

  return (
    <Card variant="default">
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays size={18} className="text-accent" aria-hidden />
        <h3 className="text-h3 text-text-primary">Próximos eventos</h3>
      </div>
      <ul className="flex flex-col gap-3">
        {events.map((e) => (
          <li
            key={e.id}
            className="flex items-start gap-3 pb-3 last:pb-0 border-b border-border-subtle last:border-0"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant={TYPE_VARIANT[e.type]}>
                  {TYPE_LABELS[e.type]}
                </Badge>
                <span className="text-caption text-text-muted tnum">
                  {formatBR(e.startsAt)}
                </span>
              </div>
              <p className="text-body-lg text-text-primary truncate">
                {e.title}
              </p>
              {e.location && (
                <p className="text-caption text-text-muted truncate flex items-center gap-1">
                  <MapPin size={12} aria-hidden /> {e.location}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
