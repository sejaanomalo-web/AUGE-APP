import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StravaConnectCard } from "@/components/aluno/StravaConnectCard";
import { requireRole } from "@/lib/auth-helpers";
import { getMyStravaStatus } from "@/lib/actions/strava";
import { prisma } from "@/lib/prisma";

function formatKm(meters: number): string {
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatPace(seconds: number, meters: number): string {
  if (!meters || meters <= 0) return "—";
  const sPerKm = seconds / (meters / 1000);
  const m = Math.floor(sPerKm / 60);
  const s = Math.round(sPerKm % 60);
  return `${m}'${s.toString().padStart(2, "0")}"/km`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function IntegracoesAlunoPage() {
  const user = await requireRole("ALUNO");
  const status = await getMyStravaStatus();

  const activities = status.connected
    ? await prisma.stravaActivity.findMany({
        where: { studentId: user.id },
        orderBy: { startDate: "desc" },
        take: 50,
        select: {
          id: true,
          type: true,
          name: true,
          distanceMeters: true,
          movingTimeSeconds: true,
          startDate: true,
        },
      })
    : [];

  return (
    <div className="max-w-2xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/perfil">
          <IconButton aria-label="Voltar">
            <ChevronLeft size={20} />
          </IconButton>
        </Link>
        <div>
          <h1 className="text-h1 text-text-primary">Integrações</h1>
          <p className="text-body text-text-secondary">
            Conecte serviços para sincronizar seus treinos
          </p>
        </div>
      </header>

      <section className="mb-8">
        <StravaConnectCard status={status} />
      </section>

      {status.connected && (
        <section className="mb-6">
          <h2 className="text-h3 text-text-primary mb-3">
            Últimas atividades sincronizadas
          </h2>
          {activities.length === 0 ? (
            <Card variant="default">
              <p className="text-body text-text-secondary">
                Nenhuma atividade sincronizada ainda. Tente "Sincronizar agora".
              </p>
            </Card>
          ) : (
            <ul className="flex flex-col gap-2">
              {activities.map((a) => (
                <li key={a.id}>
                  <Card variant="default" className="flex items-center gap-3">
                    <Badge variant="info">{a.type}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-semibold text-text-primary truncate">
                        {a.name}
                      </p>
                      <p className="text-caption text-text-muted">
                        {formatDate(a.startDate)} · {formatKm(a.distanceMeters)} ·{" "}
                        {formatPace(a.movingTimeSeconds, a.distanceMeters)}
                      </p>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
