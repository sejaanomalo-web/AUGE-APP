"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Clock, ListChecks, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";

export function StartWorkoutCTA({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  function pick(mode: "GUIDED" | "FREE") {
    setSubmitting(true);
    router.push(`/treino/${sessionId}/executar?mode=${mode}`);
  }

  return (
    <>
      <Button
        variant="primary"
        size="cta"
        fullWidth
        onClick={() => setOpen(true)}
      >
        Iniciar treino
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => !submitting && setOpen(o)}
        title="Como você quer treinar?"
        description="Escolha o modo da sessão. Você pode trocar depois."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ModeCard
            icon={<ListChecks size={28} className="text-accent" aria-hidden />}
            title="Treino guiado"
            description="Eu te conduzo exercício por exercício. Marco séries, timer de descanso automático."
            recommended
            onClick={() => pick("GUIDED")}
            disabled={submitting}
          />
          <ModeCard
            icon={<Clock size={28} className="text-accent" aria-hidden />}
            title="Treino livre"
            description="Só conto o tempo total. Você executa do seu jeito e marca o que fez no final."
            onClick={() => pick("FREE")}
            disabled={submitting}
          />
        </div>

        <div className="flex justify-end mt-4">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            <X size={14} aria-hidden /> Cancelar
          </Button>
        </div>
      </Dialog>
    </>
  );
}

function ModeCard({
  icon,
  title,
  description,
  recommended,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  recommended?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group bg-bg-elevated rounded-md p-5 text-left transition-all duration-200",
        "hover:bg-bg-hover hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        "disabled:opacity-50 disabled:pointer-events-none relative",
        recommended && "ring-1 ring-accent/40",
      )}
    >
      {recommended && (
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-pill bg-accent-glow text-accent text-[10px] uppercase tracking-[0.06em] font-semibold">
          Recomendado
        </span>
      )}
      {icon}
      <h3 className="mt-3 text-h3 text-text-primary">{title}</h3>
      <p className="mt-1 text-body text-text-secondary">{description}</p>
    </button>
  );
}
