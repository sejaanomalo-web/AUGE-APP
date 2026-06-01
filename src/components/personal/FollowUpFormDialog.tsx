"use client";

import * as React from "react";
import { Send, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { sendFormToStudent } from "@/lib/actions/followup-forms";

export interface FollowUpTemplateOption {
  id: string;
  name: string;
  questionsCount: number;
}

export function FollowUpFormDialog({
  studentId,
  templates,
  open,
  onClose,
}: {
  studentId: string;
  templates: FollowUpTemplateOption[];
  open: boolean;
  onClose: () => void;
}) {
  const [templateId, setTemplateId] = React.useState<string>("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  // Pré-seleciona primeiro template ao abrir, evita estado vazio confuso.
  React.useEffect(() => {
    if (open && templates.length > 0 && !templateId) {
      setTemplateId(templates[0].id);
    }
    if (!open) {
      setDone(false);
      setError(null);
    }
  }, [open, templates, templateId]);

  async function handleSend() {
    if (!templateId) return;
    setSending(true);
    setError(null);
    try {
      await sendFormToStudent({ templateId, studentId });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title="Enviar formulário"
      description="O aluno recebe um link e uma notificação para responder."
    >
      {done ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center">
            <Check size={24} />
          </div>
          <p className="text-body text-text-primary">Formulário enviado.</p>
          <Button variant="primary" size="md" onClick={onClose}>
            Fechar
          </Button>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-body text-text-secondary">
            Você ainda não tem templates de formulário. Crie um em
            {" "}
            <span className="text-text-primary font-semibold">/formularios</span>
            .
          </p>
          <div className="flex justify-end">
            <Button variant="secondary" size="md" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Field label="Template" htmlFor="followup-template">
            <Select
              id="followup-template"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.questionsCount}{" "}
                  {t.questionsCount === 1 ? "pergunta" : "perguntas"})
                </option>
              ))}
            </Select>
          </Field>

          {error && (
            <p className="text-body text-error" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={sending}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSend}
              disabled={sending || !templateId}
            >
              <Send size={16} aria-hidden />
              {sending ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
