"use client";

import * as React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/**
 * Confirmação de exclusão DEFINITIVA de um plano de treino. Exige que o
 * personal digite "EXCLUIR" por extenso e marque o checkbox de ciência de que
 * os dados somem para ele e para o aluno. Reforça a alternativa não-destrutiva
 * (Desativar). O botão só habilita com texto exato + checkbox marcado.
 */
export function DeletePlanDialog({
  open,
  onOpenChange,
  planName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  planName: string;
  onConfirm: () => Promise<void> | void;
}) {
  const [text, setText] = React.useState("");
  const [ack, setAck] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setText("");
      setAck(false);
      setDeleting(false);
    }
  }, [open]);

  const canDelete = text.trim().toUpperCase() === "EXCLUIR" && ack && !deleting;

  async function handle() {
    if (!canDelete) return;
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Excluir plano de treino"
      description={`"${planName}" será removido permanentemente.`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-lg border border-error/40 bg-error/10 px-3.5 py-3">
          <AlertTriangle
            size={18}
            className="text-error shrink-0 mt-0.5"
            aria-hidden
          />
          <p className="text-caption text-text-secondary">
            Esta ação é irreversível. Todos os treinos, registros e métricas
            deste plano serão apagados para você e para o seu aluno. Se quiser
            apenas tirar o plano do app do aluno mas manter os dados, use a
            opção <strong className="text-text-primary">Desativar</strong> no
            menu.
          </p>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-accent"
          />
          <span className="text-body text-text-secondary">
            Estou ciente que o plano será excluído e todos os dados dele
            excluídos para mim e para meu aluno.
          </span>
        </label>

        <div>
          <p className="text-caption text-text-secondary mb-1.5">
            Digite{" "}
            <strong className="text-text-primary tracking-wide">EXCLUIR</strong>{" "}
            para confirmar:
          </p>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="EXCLUIR"
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={12}
            aria-label="Confirmação de exclusão"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="secondary"
            size="md"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            size="md"
            onClick={handle}
            disabled={!canDelete}
          >
            <Trash2 size={14} aria-hidden /> {deleting ? "Excluindo..." : "Excluir plano"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
