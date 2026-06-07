import { Apple, Dumbbell } from "lucide-react";

type VerticalKey = "treinos" | "nutricao";

const META: Record<
  VerticalKey,
  { label: string; icon: typeof Apple }
> = {
  treinos: { label: "Treino", icon: Dumbbell },
  nutricao: { label: "Nutrição", icon: Apple },
};

/**
 * Faixa fina abaixo do header que deixa explícito em qual vertical o aluno está.
 * As cores acompanham `--accent`, que já é re-tintado para teal em rotas
 * `/nutricao/*` via `[data-vertical="nutricao"]`. Só faz sentido quando o aluno
 * tem ambas verticais (renderizado condicionalmente pelo shell).
 */
export function VerticalBanner({ vertical }: { vertical: VerticalKey }) {
  const { label, icon: Icon } = META[vertical];
  return (
    <div className="bg-accent/10 border-b border-accent/20">
      <div className="flex items-center gap-2 px-4 lg:px-8 py-1.5">
        <Icon size={15} className="text-accent" aria-hidden />
        <span className="text-caption font-semibold text-accent">
          Você está em {label}
        </span>
      </div>
    </div>
  );
}
