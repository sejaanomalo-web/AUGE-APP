import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock, Target } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { StartWorkoutCTA } from "@/components/aluno/StartWorkoutCTA";
import { HeroCard } from "@/components/visual/HeroCard";
import { requireRole } from "@/lib/auth-helpers";
import { getSessionById } from "@/lib/actions/workout-sessions";
import { formatKg, formatDuration } from "@/lib/utils";

export default async function TreinoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ALUNO");
  const { id } = await params;
  const session = await getSessionById(id);
  if (!session) return notFound();

  return (
    <div className="max-w-3xl mx-auto pb-32 lg:pb-12">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/hoje">
          <IconButton aria-label="Voltar">
            <ChevronLeft size={20} />
          </IconButton>
        </Link>
        <div className="min-w-0">
          <Badge variant="new">Missão de hoje</Badge>
          <h1 className="mt-2 text-h1 text-text-primary truncate">
            {session.name}
          </h1>
          <p className="text-body text-text-secondary">
            {session.exercises.length} exercícios
          </p>
        </div>
      </header>

      <HeroCard intensity="subtle" className="p-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center shrink-0">
            <Target size={22} className="text-accent" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-stat-label uppercase text-text-muted">
              Plano ativo
            </p>
            <p className="text-h3 text-text-primary truncate">
              {session.plan.name}
            </p>
          </div>
        </div>
      </HeroCard>

      <ol className="flex flex-col gap-3">
        {session.exercises.map((p, i) => (
          <li key={p.id}>
            <Card variant="interactive" className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-bg-elevated border border-border-subtle flex items-center justify-center shrink-0">
                <span className="text-body-lg font-bold text-text-primary tnum">
                  {i + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-lg text-text-primary font-semibold truncate">
                  {p.exercise.name}
                </p>
                <p className="text-caption text-text-secondary tnum">
                  {p.sets} × {p.reps}
                  {p.weight && p.weight > 0
                    ? ` · ${formatKg(p.weight)} sugerido`
                    : ""}
                </p>
                {p.restSeconds && p.restSeconds > 0 && (
                  <p className="text-caption text-text-muted inline-flex items-center gap-1 mt-0.5">
                    <Clock size={12} aria-hidden />
                    {formatDuration(p.restSeconds)} descanso
                  </p>
                )}
              </div>
              <Badge variant="info">{p.exercise.muscleGroup}</Badge>
            </Card>
          </li>
        ))}
      </ol>

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+88px)] inset-x-0 lg:relative lg:bottom-auto lg:mt-8 lg:px-0 px-4 lg:z-auto z-20">
        <StartWorkoutCTA sessionId={session.id} />
      </div>
    </div>
  );
}
