"use client";

import * as React from "react";
import { Check, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FollowUpQuestionType } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { maskDecimal, parseDecimalBR } from "@/lib/masks";
import { submitFormAnswers } from "@/lib/actions/followup-forms";

interface Question {
  id: string;
  label: string;
  type: FollowUpQuestionType;
  required: boolean;
  order: number;
}

interface Send {
  id: string;
  token: string;
}

type AnswerState = {
  valueText: string | null;
  valueNumber: number | null;
  valueBool: boolean | null;
};

function emptyAnswer(): AnswerState {
  return { valueText: null, valueNumber: null, valueBool: null };
}

export function FollowUpFormRunner({
  send,
  template,
}: {
  send: Send;
  template: {
    id: string;
    name: string;
    description: string | null;
    questions: Question[];
  };
}) {
  const router = useRouter();
  const [answers, setAnswers] = React.useState<Record<string, AnswerState>>(
    () =>
      Object.fromEntries(
        template.questions.map((q) => [q.id, emptyAnswer()] as const),
      ),
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  function update(id: string, patch: Partial<AnswerState>) {
    setAnswers((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await submitFormAnswers({
        token: send.token,
        answers: template.questions.map((q) => ({
          questionId: q.id,
          valueText: answers[q.id]?.valueText ?? null,
          valueNumber: answers[q.id]?.valueNumber ?? null,
          valueBool: answers[q.id]?.valueBool ?? null,
        })),
      });
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card variant="default" className="text-center py-10 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-success/15 text-success flex items-center justify-center">
          <Check size={28} />
        </div>
        <h2 className="text-h2 text-text-primary">Respostas enviadas</h2>
        <p className="text-body text-text-secondary">
          Seu personal já tem acesso ao retorno.
        </p>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {template.description && (
        <Card variant="default">
          <p className="text-body text-text-secondary whitespace-pre-wrap">
            {template.description}
          </p>
        </Card>
      )}

      {template.questions.map((q) => (
        <Card key={q.id} variant="default" className="flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <span className="text-caption text-text-muted tnum pt-0.5">
              {q.order + 1}.
            </span>
            <p className="text-body-lg text-text-primary flex-1">
              {q.label}
              {q.required && (
                <span className="text-error ml-1" aria-label="obrigatório">
                  *
                </span>
              )}
            </p>
          </div>
          <QuestionInput
            type={q.type}
            value={answers[q.id]}
            onChange={(patch) => update(q.id, patch)}
          />
        </Card>
      ))}

      {error && (
        <p className="text-body text-error" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="cta"
        fullWidth
        disabled={submitting}
      >
        <Send size={18} aria-hidden />
        {submitting ? "Enviando..." : "Enviar respostas"}
      </Button>
    </form>
  );
}

function QuestionInput({
  type,
  value,
  onChange,
}: {
  type: FollowUpQuestionType;
  value: AnswerState | undefined;
  onChange: (patch: Partial<AnswerState>) => void;
}) {
  if (type === "TEXT") {
    return (
      <Input
        value={value?.valueText ?? ""}
        onChange={(e) => onChange({ valueText: e.target.value })}
        placeholder="Sua resposta"
      />
    );
  }
  if (type === "TEXTAREA") {
    return (
      <Textarea
        value={value?.valueText ?? ""}
        onChange={(e) => onChange({ valueText: e.target.value })}
        placeholder="Sua resposta"
        rows={4}
      />
    );
  }
  if (type === "NUMBER") {
    return <NumberQuestionInput value={value} onChange={onChange} />;
  }
  if (type === "RATING_1_5") {
    const n = value?.valueNumber ?? 0;
    return (
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange({ valueNumber: i })}
            aria-label={`Nota ${i}`}
            className={cn(
              "w-12 h-12 rounded-full border font-bold tnum transition-colors duration-200",
              i <= n
                ? "bg-accent text-text-on-accent border-accent shadow-accent"
                : "bg-bg-surface text-text-secondary border-border-subtle hover:border-border-strong",
            )}
          >
            {i}
          </button>
        ))}
      </div>
    );
  }
  if (type === "YES_NO") {
    const v = value?.valueBool;
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange({ valueBool: true })}
          className={cn(
            "flex-1 min-h-[48px] rounded-pill font-bold border transition-colors duration-200",
            v === true
              ? "bg-accent text-text-on-accent border-accent shadow-accent"
              : "bg-bg-surface text-text-secondary border-border-subtle hover:border-border-strong",
          )}
        >
          Sim
        </button>
        <button
          type="button"
          onClick={() => onChange({ valueBool: false })}
          className={cn(
            "flex-1 min-h-[48px] rounded-pill font-bold border transition-colors duration-200",
            v === false
              ? "bg-accent text-text-on-accent border-accent shadow-accent"
              : "bg-bg-surface text-text-secondary border-border-subtle hover:border-border-strong",
          )}
        >
          Não
        </button>
      </div>
    );
  }
  return null;
}

// Campo numérico decimal (vírgula BR). Mantém um texto local para a digitação
// e armazena o number já convertido em valueNumber (parse via parseDecimalBR).
function NumberQuestionInput({
  value,
  onChange,
}: {
  value: AnswerState | undefined;
  onChange: (patch: Partial<AnswerState>) => void;
}) {
  const [text, setText] = React.useState(() =>
    value?.valueNumber == null ? "" : String(value.valueNumber).replace(".", ","),
  );
  return (
    <Input
      inputMode="decimal"
      mask={(s) => maskDecimal(s, { intDigits: 6, decimals: 2 })}
      value={text}
      onChange={(e) => {
        const t = e.target.value;
        setText(t);
        onChange({ valueNumber: parseDecimalBR(t) });
      }}
      placeholder="0"
    />
  );
}
