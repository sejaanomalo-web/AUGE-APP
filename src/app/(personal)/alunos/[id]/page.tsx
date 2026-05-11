import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pause, Pencil, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { WorkoutCard } from "@/components/aluno/WorkoutCard";
import { EvolutionChart } from "@/components/aluno/EvolutionChart";
import {
  activePlan,
  alunoStats,
  alunosSummary,
  bodyMetrics,
  exams,
  workoutLogs,
} from "@/lib/mock-data";
import { formatLongDate, formatShortDate } from "@/lib/date";

export default async function AlunoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const summary = alunosSummary.find((s) => s.user.id === id);
  if (!summary) return notFound();
  const isBruno = id === "u_aluno_bruno";
  const logs = isBruno
    ? [...workoutLogs].sort((a, b) => b.date.localeCompare(a.date))
    : [];
  const weight = isBruno
    ? bodyMetrics.map((m) => ({
        label: formatShortDate(m.date),
        value: m.weightKg,
      }))
    : [];

  return (
    <div className="max-w-5xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/alunos">
          <IconButton aria-label="Voltar">
            <ChevronLeft size={20} />
          </IconButton>
        </Link>
        <Avatar src={summary.user.avatar} name={summary.user.name} size={56} />
        <div className="flex-1 min-w-0">
          <h1 className="text-h1 text-text-primary truncate">
            {summary.user.name}
          </h1>
          <p className="text-caption text-text-muted truncate">
            {summary.plano}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Pencil size={14} aria-hidden /> Editar
          </Button>
          <Button variant="secondary" size="sm">
            <Pause size={14} aria-hidden /> Pausar
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 size={14} aria-hidden /> Remover
          </Button>
        </div>
      </header>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="treinos">Treinos</TabsTrigger>
          <TabsTrigger value="medidas">Medidas</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard label="Aderência" value={`${summary.aderencia}%`} />
            <StatCard
              label="Treinos esta sem"
              value={`${summary.treinosSemana.feitos}/${summary.treinosSemana.prescritos}`}
            />
            <StatCard label="Streak" value={`${alunoStats.streakDias} dias`} />
            <StatCard
              label="Volume sem"
              value={`${alunoStats.volumeSemanaKg.toLocaleString("pt-BR")} kg`}
            />
          </section>

          <Card variant="default" className="mb-6">
            <h3 className="text-h3 text-text-primary mb-3">Plano ativo</h3>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-body-lg text-text-primary font-semibold">
                  {summary.plano}
                </p>
                {isBruno && (
                  <p className="text-caption text-text-muted">
                    {formatLongDate(activePlan.startDate)} –{" "}
                    {formatLongDate(activePlan.endDate)}
                  </p>
                )}
              </div>
              <Badge>{summary.status === "ativo" ? "Ativo" : "Pausado"}</Badge>
            </div>
          </Card>

          {isBruno && weight.length > 0 && (
            <Card variant="default">
              <h3 className="text-h3 text-text-primary mb-3">Peso corporal</h3>
              <EvolutionChart data={weight} unit="kg" variant="line" />
            </Card>
          )}
        </TabsContent>

        <TabsContent value="treinos">
          {logs.length === 0 ? (
            <Card variant="default">
              <p className="text-body text-text-secondary">
                Sem histórico de treinos para esse aluno ainda.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {logs.slice(0, 12).map((l) => (
                <WorkoutCard
                  key={l.id}
                  log={{
                    id: l.id,
                    date: l.date,
                    sessionLetter: l.sessionLetter,
                    sessionName: l.sessionName,
                    status: l.status,
                    durationSeconds: l.durationSeconds,
                    totalVolumeKg: l.totalVolumeKg,
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="medidas">
          {isBruno ? (
            <Card variant="default" className="p-0 overflow-hidden">
              <table className="w-full text-body tnum">
                <thead>
                  <tr className="text-caption text-text-muted uppercase tracking-[0.08em] border-b border-border-subtle">
                    <th className="text-left p-3 font-medium">Data</th>
                    <th className="text-right p-3 font-medium">Peso</th>
                    <th className="text-right p-3 font-medium">% Gord.</th>
                    <th className="text-right p-3 font-medium">Cintura</th>
                  </tr>
                </thead>
                <tbody>
                  {[...bodyMetrics]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((m) => (
                      <tr
                        key={m.id}
                        className="border-b border-border-subtle/60"
                      >
                        <td className="p-3 text-text-secondary">
                          {formatShortDate(m.date)}
                        </td>
                        <td className="p-3 text-right text-text-primary">
                          {m.weightKg.toFixed(1)}
                        </td>
                        <td className="p-3 text-right text-text-primary">
                          {m.bodyFatPercent.toFixed(1)}%
                        </td>
                        <td className="p-3 text-right text-text-primary">
                          {m.waistCm.toFixed(1)} cm
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </Card>
          ) : (
            <Card variant="default">
              <p className="text-body text-text-secondary">
                Sem medidas registradas ainda.
              </p>
            </Card>
          )}

          {isBruno && (
            <div className="mt-4">
              <h3 className="text-h3 text-text-primary mb-3">Exames</h3>
              <ul className="flex flex-col gap-2">
                {exams.map((e) => (
                  <li key={e.id}>
                    <Card variant="default">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-body-lg text-text-primary font-semibold truncate">
                            {e.type}
                          </p>
                          <p className="text-caption text-text-muted">
                            {formatLongDate(e.date)}
                          </p>
                        </div>
                        <StatusBadge status="concluido" />
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="evolucao">
          {isBruno && weight.length > 0 ? (
            <Card variant="default">
              <h3 className="text-h3 text-text-primary mb-3">
                Peso corporal — últimas 12 semanas
              </h3>
              <EvolutionChart data={weight} unit="kg" variant="line" />
            </Card>
          ) : (
            <Card variant="default">
              <p className="text-body text-text-secondary">
                Dados de evolução ainda não disponíveis.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
