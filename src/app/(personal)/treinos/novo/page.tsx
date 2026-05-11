import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { WorkoutBuilder } from "@/components/personal/WorkoutBuilder";

export default function NovoPlanoPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/treinos">
          <IconButton aria-label="Voltar">
            <ChevronLeft size={20} />
          </IconButton>
        </Link>
        <div>
          <h1 className="text-h1 text-text-primary">Novo plano de treino</h1>
          <p className="text-body text-text-secondary">
            Monte as sessões e prescreva os exercícios para o aluno.
          </p>
        </div>
      </header>
      <WorkoutBuilder />
    </div>
  );
}
