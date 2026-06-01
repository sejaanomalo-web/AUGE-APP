"use client";

import * as React from "react";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Archive,
  Pencil,
  Save,
  X,
} from "lucide-react";
import type { FollowUpQuestionType } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { IconButton } from "@/components/ui/IconButton";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import {
  archiveTemplate,
  createTemplate,
  updateTemplate,
} from "@/lib/actions/followup-forms";

export interface TemplateView {
  id: string;
  name: string;
  description: string | null;
  isArchived: boolean;
  questions: {
    id: string;
    label: string;
    type: FollowUpQuestionType;
    required: boolean;
    order: number;
  }[];
}

interface DraftQuestion {
  label: string;
  type: FollowUpQuestionType;
  required: boolean;
}

const TYPE_LABELS: Record<FollowUpQuestionType, string> = {
  TEXT: "Texto curto",
  TEXTAREA: "Texto longo",
  RATING_1_5: "Nota 1-5",
  YES_NO: "Sim/Não",
  NUMBER: "Número",
};

function emptyDraft(): DraftQuestion {
  return { label: "", type: "TEXT", required: true };
}

export function FollowUpTemplatesManager({
  templates,
}: {
  templates: TemplateView[];
}) {
  const [editing, setEditing] = React.useState<TemplateView | null>(null);
  const [creating, setCreating] = React.useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="md"
          onClick={() => setCreating(true)}
        >
          <Plus size={16} aria-hidden /> Novo template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card variant="default" className="text-center py-10">
          <p className="text-body text-text-secondary">
            Nenhum template criado ainda.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((t) => (
            <Card key={t.id} variant="default">
              <CardHeader>
                <div className="min-w-0">
                  <CardTitle className="truncate">{t.name}</CardTitle>
                  {t.description && (
                    <CardDescription className="line-clamp-2">
                      {t.description}
                    </CardDescription>
                  )}
                </div>
                <Badge variant="info">
                  {t.questions.length}{" "}
                  {t.questions.length === 1 ? "pergunta" : "perguntas"}
                </Badge>
              </CardHeader>

              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing(t)}
                >
                  <Pencil size={14} aria-hidden /> Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    if (!confirm("Arquivar este template?")) return;
                    await archiveTemplate(t.id);
                    // Próximo render via revalidatePath devolve lista atualizada.
                    window.location.reload();
                  }}
                >
                  <Archive size={14} aria-hidden /> Arquivar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <TemplateEditor
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function TemplateEditor({
  initial,
  onClose,
}: {
  initial: TemplateView | null;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [description, setDescription] = React.useState(
    initial?.description ?? "",
  );
  const [questions, setQuestions] = React.useState<DraftQuestion[]>(
    initial?.questions.map((q) => ({
      label: q.label,
      type: q.type,
      required: q.required,
    })) ?? [emptyDraft()],
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function updateQuestion(idx: number, patch: Partial<DraftQuestion>) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)),
    );
  }

  function move(idx: number, dir: -1 | 1) {
    setQuestions((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function removeAt(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function save() {
    setError(null);
    if (!name.trim()) {
      setError("Nome obrigatório");
      return;
    }
    if (questions.length === 0) {
      setError("Adicione pelo menos uma pergunta");
      return;
    }
    if (questions.some((q) => !q.label.trim())) {
      setError("Toda pergunta precisa de um título");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        questions: questions.map((q, i) => ({
          label: q.label.trim(),
          type: q.type,
          required: q.required,
          order: i,
        })),
      };
      if (initial) {
        await updateTemplate(initial.id, payload);
      } else {
        await createTemplate(payload);
      }
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={initial ? "Editar template" : "Novo template"}
      className="max-w-[640px]"
    >
      <div className="flex flex-col gap-4">
        <Field label="Nome" htmlFor="tpl-name">
          <Input
            id="tpl-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Check-in semanal"
          />
        </Field>

        <Field label="Descrição (opcional)" htmlFor="tpl-desc">
          <Textarea
            id="tpl-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contexto rápido para o aluno"
            rows={2}
          />
        </Field>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-h3 text-text-primary">Perguntas</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setQuestions((prev) => [...prev, emptyDraft()])
              }
            >
              <Plus size={14} aria-hidden /> Adicionar
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {questions.map((q, idx) => (
              <Card key={idx} variant="elevated" className="p-4">
                <div className="flex items-start gap-2">
                  <span className="text-caption text-text-muted tnum pt-3 w-6 text-center">
                    {idx + 1}
                  </span>
                  <div className="flex-1 flex flex-col gap-2 min-w-0">
                    <Input
                      placeholder="Texto da pergunta"
                      value={q.label}
                      onChange={(e) =>
                        updateQuestion(idx, { label: e.target.value })
                      }
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex-1 min-w-[180px]">
                        <Select
                          value={q.type}
                          onChange={(e) =>
                            updateQuestion(idx, {
                              type: e.target
                                .value as FollowUpQuestionType,
                            })
                          }
                        >
                          {(
                            Object.keys(TYPE_LABELS) as FollowUpQuestionType[]
                          ).map((t) => (
                            <option key={t} value={t}>
                              {TYPE_LABELS[t]}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <label className="flex items-center gap-2 text-body text-text-secondary cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) =>
                            updateQuestion(idx, {
                              required: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-accent"
                        />
                        Obrigatória
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <IconButton
                      aria-label="Mover para cima"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                    >
                      <ArrowUp size={16} />
                    </IconButton>
                    <IconButton
                      aria-label="Mover para baixo"
                      onClick={() => move(idx, 1)}
                      disabled={idx === questions.length - 1}
                    >
                      <ArrowDown size={16} />
                    </IconButton>
                    <IconButton
                      aria-label="Remover pergunta"
                      onClick={() => removeAt(idx)}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-body text-error" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={submitting}
          >
            <X size={16} aria-hidden /> Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={save}
            disabled={submitting}
          >
            <Save size={16} aria-hidden />
            {submitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
