import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { LinkButton } from "@/components/ui/LinkButton";
import { activePlan, exercisesById } from "@/lib/mock-data";
import { formatKg, formatDuration } from "@/lib/utils";

export default async function TreinoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = activePlan.sessions.find((s) => s.id === id);
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
          <Badge>Treino {session.letter}</Badge>
          <h1 className="mt-2 text-h1 text-text-primary truncate">
            {session.name}
          </h1>
          <p className="text-body text-text-secondary">
            {session.exercises.length} exercícios · ~{session.estimatedMinutes}{" "}
            min
          </p>
        </div>
      </header>

      <ol className="flex flex-col gap-3">
        {session.exercises.map((p, i) => {
          const meta = exercisesById.get(p.exerciseId);
          return (
            <li key={p.id}>
              <Card variant="default" className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-bg-elevated flex items-center justify-center shrink-0">
                  <span className="text-body-lg font-bold text-text-primary tnum">
                    {i + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-lg text-text-primary font-semibold truncate">
                    {meta?.name ?? "Exercício"}
                  </p>
                  <p className="text-caption text-text-secondary tnum">
                    {p.sets} × {p.reps} ·{" "}
                    {p.weightKgSuggested > 0
                      ? formatKg(p.weightKgSuggested)
                      : "PC"}{" "}
                    sugerido
                  </p>
                  <p className="text-caption text-text-muted inline-flex items-center gap-1 mt-0.5">
                    <Clock size={12} aria-hidden />
                    {formatDuration(p.restSeconds)} descanso
                  </p>
                </div>
                <Badge>{meta?.muscleGroup ?? ""}</Badge>
              </Card>
            </li>
          );
        })}
      </ol>

      <div className="fixed bottom-0 inset-x-0 lg:relative lg:mt-8 bg-bg-base/95 backdrop-blur lg:bg-transparent lg:backdrop-blur-none p-4 lg:p-0 pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:pb-0 border-t border-border-subtle lg:border-0 z-20">
        <LinkButton
          href={`/treino/${session.id}/executar`}
          variant="primary"
          size="cta"
          fullWidth
        >
          Iniciar treino
        </LinkButton>
      </div>
    </div>
  );
}
