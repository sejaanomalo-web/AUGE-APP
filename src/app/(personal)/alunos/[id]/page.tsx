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
import { EmptyState } from "@/components/shared/EmptyState";
import { WorkoutCard } from "@/components/aluno/WorkoutCard";
import { EvolutionChart } from "@/components/aluno/EvolutionChart";
import { requireRole } from "@/lib/auth-helpers";
import { getStudentById } from "@/lib/actions/students";
import { getAlunoWeeklyStats } from "@/lib/aluno-stats";
import { prisma } from "@/lib/prisma";
import { formatLongDate, formatShortDate } from "@/lib/date";

export default async function AlunoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("PERSONAL");
  const { id } = await params;
  let student;
  try {
    student = await getStudentById(id);
  } catch {
    return notFound();
  }
  if (!student) return notFound();

  const stats = await getAlunoWeeklyStats(id);
  const activePlan = await prisma.workoutPlan.findFirst({
    where: { studentId: id, isActive: true },
  });

  const weight = student.bodyMetrics
    .filter((m) => m.weight != null)
    .slice()
    .reverse()
    .map((m) => ({
      label: formatShortDate(m.date.toISOString().slice(0, 10)),
      value: m.weight!,
    }));

  return (
    <div className="max-w-5xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/alunos">
          <IconButton aria-label="Voltar">
            <ChevronLeft size={20} />
          </IconButton>
        </Link>
        <Avatar
          src={student.avatarUrl ?? undefined}
          name={student.name}
          size={56}
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-h1 text-text-primary truncate">{student.name}</h1>
          <p className="text-caption text-text-muted truncate">
            {activePlan?.name ?? "Sem plano ativo"}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled>
            <Pencil size={14} aria-hidden /> Editar
          </Button>
          <Button variant="secondary" size="sm" disabled>
            <Pause size={14} aria-hidden /> Pausar
          </Button>
          <Button variant="destructive" size="sm" disabled>
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
            <StatCard
              label="Treinos esta sem"
              value={stats.completedWorkouts.toString()}
            />
            <StatCard label="Streak" value={`${stats.streakDays} dias`} />
            <StatCard
              label="Volume sem"
              value={
                stats.volume > 0
                  ? `${stats.volume.toLocaleString("pt-BR")} kg`
                  : "—"
              }
            />
            <StatCard
              label="Tempo médio"
              value={stats.avgMinutes > 0 ? `${stats.avgMinutes} min` : "—"}
            />
          </section>

          <Card variant="default" className="mb-6">
            <h3 className="text-h3 text-text-primary mb-3">Plano ativo</h3>
            {activePlan ? (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-body-lg text-text-primary font-semibold">
                    {activePlan.name}
                  </p>
                  <p className="text-caption text-text-muted">
                    {formatLongDate(activePlan.startDate.toISOString())}
                    {activePlan.endDate
                      ? ` – ${formatLongDate(activePlan.endDate.toISOString())}`
                      : ""}
                  </p>
                </div>
                <Badge variant="concluido">Ativo</Badge>
              </div>
            ) : (
              <p className="text-body text-text-secondary">
                Sem plano ativo. Crie um para este aluno em /treinos/novo.
              </p>
            )}
          </Card>

          {weight.length >= 2 && (
            <Card variant="default">
              <h3 className="text-h3 text-text-primary mb-3">Peso corporal</h3>
              <EvolutionChart data={weight} unit="kg" variant="line" />
            </Card>
          )}
        </TabsContent>

        <TabsContent value="treinos">
          {student.workoutLogs.length === 0 ? (
            <Card variant="default">
              <p className="text-body text-text-secondary">
                Sem histórico de treinos para esse aluno ainda.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {student.workoutLogs.slice(0, 12).map((l) => (
                <WorkoutCard
                  key={l.id}
                  log={{
                    id: l.id,
                    date: l.startedAt.toISOString().slice(0, 10),
                    sessionLetter: l.session.name.charAt(0) || "T",
                    sessionName: l.session.name,
                    status:
                      l.status === "COMPLETED"
                        ? "concluido"
                        : l.status === "ABANDONED"
                          ? "pulado"
                          : "em_andamento",
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="medidas">
          {student.bodyMetrics.length === 0 ? (
            <EmptyState
              title="Sem medidas"
              description="Este aluno ainda não registrou medidas corporais."
            />
          ) : (
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
                  {student.bodyMetrics.map((m) => {
                    const meas = (m.measurements as Record<string, number> | null) ?? {};
                    return (
                      <tr key={m.id} className="border-b border-border-subtle/60">
                        <td className="p-3 text-text-secondary">
                          {formatShortDate(m.date.toISOString().slice(0, 10))}
                        </td>
                        <td className="p-3 text-right text-text-primary">
                          {m.weight != null ? m.weight.toFixed(1) : "—"}
                        </td>
                        <td className="p-3 text-right text-text-primary">
                          {m.bodyFat != null ? `${m.bodyFat.toFixed(1)}%` : "—"}
                        </td>
                        <td className="p-3 text-right text-text-primary">
                          {meas.waist != null ? `${meas.waist.toFixed(1)} cm` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="evolucao">
          {weight.length >= 2 ? (
            <Card variant="default">
              <h3 className="text-h3 text-text-primary mb-3">
                Peso corporal — histórico
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
