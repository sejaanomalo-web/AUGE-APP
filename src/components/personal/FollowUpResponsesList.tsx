"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Star } from "lucide-react";
import type { FollowUpFormStatus, FollowUpQuestionType } from "@prisma/client";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export interface FollowUpSendView {
  id: string;
  status: FollowUpFormStatus;
  sentAt: string; // ISO
  answeredAt: string | null;
  template: {
    id: string;
    name: string;
    description: string | null;
    questions: {
      id: string;
      label: string;
      type: FollowUpQuestionType;
      order: number;
    }[];
  };
  answers: {
    questionId: string;
    valueText: string | null;
    valueNumber: number | null;
    valueBool: boolean | null;
  }[];
}

const STATUS_LABEL: Record<FollowUpFormStatus, string> = {
  PENDING: "Pendente",
  ANSWERED: "Respondido",
  EXPIRED: "Expirado",
  REVOKED: "Revogado",
};

const STATUS_VARIANT: Record<FollowUpFormStatus, BadgeVariant> = {
  PENDING: "in_progress",
  ANSWERED: "concluido",
  EXPIRED: "pulado",
  REVOKED: "erro",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function FollowUpResponsesList({ sends }: { sends: FollowUpSendView[] }) {
  const [openId, setOpenId] = React.useState<string | null>(null);

  if (sends.length === 0) {
    return (
      <Card variant="default" className="text-center py-8">
        <p className="text-body text-text-secondary">
          Nenhum formulário enviado ainda.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sends.map((send) => {
        const open = openId === send.id;
        const answerById = new Map(
          send.answers.map((a) => [a.questionId, a] as const),
        );
        return (
          <Card key={send.id} variant="default" className="p-0 overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center gap-3 p-4 text-left"
              onClick={() => setOpenId(open ? null : send.id)}
              aria-expanded={open}
            >
              <span className="text-text-secondary">
                {open ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-body-lg font-semibold text-text-primary truncate">
                  {send.template.name}
                </p>
                <p className="text-caption text-text-muted">
                  Enviado em {formatDate(send.sentAt)}
                  {send.answeredAt
                    ? ` · Respondido em ${formatDate(send.answeredAt)}`
                    : ""}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[send.status]}>
                {STATUS_LABEL[send.status]}
              </Badge>
            </button>

            {open && (
              <div className="border-t border-border-subtle p-4 flex flex-col gap-3">
                {send.status !== "ANSWERED" && (
                  <p className="text-body text-text-secondary">
                    Sem respostas disponíveis.
                  </p>
                )}
                {send.status === "ANSWERED" &&
                  send.template.questions.map((q) => {
                    const a = answerById.get(q.id);
                    return (
                      <div key={q.id} className="flex flex-col gap-1">
                        <p className="text-caption font-semibold text-text-secondary">
                          {q.label}
                        </p>
                        <AnswerValue type={q.type} answer={a} />
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function AnswerValue({
  type,
  answer,
}: {
  type: FollowUpQuestionType;
  answer:
    | {
        valueText: string | null;
        valueNumber: number | null;
        valueBool: boolean | null;
      }
    | undefined;
}) {
  if (!answer) {
    return <p className="text-body text-text-muted">—</p>;
  }
  if (type === "YES_NO") {
    return (
      <p className="text-body text-text-primary">
        {answer.valueBool === true
          ? "Sim"
          : answer.valueBool === false
            ? "Não"
            : "—"}
      </p>
    );
  }
  if (type === "RATING_1_5") {
    const n = answer.valueNumber ?? 0;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={16}
            className={cn(
              i <= n ? "text-accent fill-accent" : "text-text-muted",
            )}
          />
        ))}
        <span className="text-caption text-text-muted ml-1 tnum">{n}/5</span>
      </div>
    );
  }
  if (type === "NUMBER") {
    return (
      <p className="text-body text-text-primary tnum">
        {answer.valueNumber ?? "—"}
      </p>
    );
  }
  return (
    <p className="text-body text-text-primary whitespace-pre-wrap">
      {answer.valueText ?? "—"}
    </p>
  );
}
