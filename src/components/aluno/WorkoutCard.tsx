import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StatusBadge, type WorkoutStatus } from "@/components/shared/StatusBadge";
import { formatDuration } from "@/lib/utils";
import { formatShortDate } from "@/lib/date";

export interface WorkoutCardData {
  id: string;
  date: string;
  sessionLetter: string;
  sessionName: string;
  status: WorkoutStatus;
  durationSeconds?: number;
  totalVolumeKg?: number;
}

export function WorkoutCard({ log }: { log: WorkoutCardData }) {
  return (
    <Link href={`/historico/${log.id}`} className="block">
      <Card variant="interactive" className="flex items-center gap-4">
        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-md bg-bg-elevated shrink-0">
          <span className="text-caption text-text-muted leading-none">
            {formatShortDate(log.date).split(" ")[0]}
          </span>
          <span className="text-micro text-text-secondary uppercase tracking-[0.08em] leading-none mt-0.5">
            {formatShortDate(log.date).split(" ")[1]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge>Treino {log.sessionLetter}</Badge>
            <StatusBadge status={log.status} />
          </div>
          <p className="text-body-lg text-text-primary font-semibold truncate">
            {log.sessionName}
          </p>
          {(log.durationSeconds || log.totalVolumeKg) && (
            <p className="text-caption text-text-muted tnum mt-0.5">
              {log.durationSeconds &&
                `${formatDuration(log.durationSeconds)} · `}
              {log.totalVolumeKg && `${log.totalVolumeKg.toLocaleString("pt-BR")} kg`}
            </p>
          )}
        </div>
        <ChevronRight
          size={20}
          className="text-text-muted shrink-0"
          aria-hidden
        />
      </Card>
    </Link>
  );
}
