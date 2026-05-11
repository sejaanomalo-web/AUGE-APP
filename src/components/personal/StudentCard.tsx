import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { formatShortDate } from "@/lib/date";
import type { AlunoSummary } from "@/lib/mock-data";

export function StudentCard({ s }: { s: AlunoSummary }) {
  return (
    <Link href={`/alunos/${s.user.id}`} className="block">
      <Card variant="interactive">
        <div className="flex items-start gap-3 mb-3">
          <Avatar src={s.user.avatar} name={s.user.name} size={48} />
          <div className="flex-1 min-w-0">
            <p className="text-body-lg text-text-primary font-semibold truncate">
              {s.user.name}
            </p>
            <p className="text-caption text-text-muted truncate">{s.plano}</p>
          </div>
          <Badge variant={s.status === "ativo" ? "concluido" : "pulado"}>
            {s.status === "ativo" ? "Ativo" : "Pausado"}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-caption text-text-muted">Aderência</p>
            <p
              className={`text-h3 tnum ${
                s.aderencia >= 80
                  ? "text-success"
                  : s.aderencia >= 65
                    ? "text-warning"
                    : "text-error"
              }`}
            >
              {s.aderencia}%
            </p>
          </div>
          <div>
            <p className="text-caption text-text-muted">Semana</p>
            <p className="text-h3 text-text-primary tnum">
              {s.treinosSemana.feitos}/{s.treinosSemana.prescritos}
            </p>
          </div>
          <div>
            <p className="text-caption text-text-muted">Último</p>
            <p className="text-h3 text-text-primary tnum">
              {formatShortDate(s.ultimoTreino)}
            </p>
          </div>
        </div>

        <Progress
          value={s.aderencia}
          max={100}
          thin
          className="mt-3"
        />
      </Card>
    </Link>
  );
}
