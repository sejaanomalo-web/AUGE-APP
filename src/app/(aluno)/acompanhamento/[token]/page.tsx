import { Clock, FileX, ShieldOff, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/Card";
import { FollowUpFormRunner } from "@/components/aluno/FollowUpFormRunner";
import { requireRole } from "@/lib/auth-helpers";
import { getSendByToken } from "@/lib/actions/followup-forms";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function AcompanhamentoPage({ params }: PageProps) {
  await requireRole("ALUNO");
  const { token } = await params;

  let send;
  try {
    send = await getSendByToken(token);
  } catch (err) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Acompanhamento" subtitle="Formulário do seu personal" />
        <Card variant="default" className="text-center py-10 flex flex-col items-center gap-3">
          <FileX size={32} className="text-text-muted" aria-hidden />
          <p className="text-body text-text-secondary">
            {err instanceof Error ? err.message : "Formulário indisponível"}
          </p>
        </Card>
      </div>
    );
  }

  // Considera estado efetivo (expirou no servidor antes do cron rodar).
  const effectiveStatus =
    send.status === "PENDING" && send.expiresAt < new Date()
      ? "EXPIRED"
      : send.status;

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={send.template.name}
        subtitle={`Enviado por ${send.trainer.name}`}
      />

      {effectiveStatus === "ANSWERED" && (
        <Card
          variant="default"
          className="text-center py-10 flex flex-col items-center gap-3"
        >
          <CheckCircle2 size={32} className="text-success" aria-hidden />
          <h2 className="text-h2 text-text-primary">Já respondido</h2>
          <p className="text-body text-text-secondary">
            Seu personal recebeu suas respostas.
          </p>
        </Card>
      )}

      {effectiveStatus === "EXPIRED" && (
        <Card
          variant="default"
          className="text-center py-10 flex flex-col items-center gap-3"
        >
          <Clock size={32} className="text-text-muted" aria-hidden />
          <h2 className="text-h2 text-text-primary">Formulário expirado</h2>
          <p className="text-body text-text-secondary">
            Peça ao seu personal para reenviar.
          </p>
        </Card>
      )}

      {effectiveStatus === "REVOKED" && (
        <Card
          variant="default"
          className="text-center py-10 flex flex-col items-center gap-3"
        >
          <ShieldOff size={32} className="text-text-muted" aria-hidden />
          <h2 className="text-h2 text-text-primary">Formulário cancelado</h2>
          <p className="text-body text-text-secondary">
            Este envio foi revogado pelo seu personal.
          </p>
        </Card>
      )}

      {effectiveStatus === "PENDING" && (
        <FollowUpFormRunner
          send={{ id: send.id, token: send.token }}
          template={{
            id: send.template.id,
            name: send.template.name,
            description: send.template.description,
            questions: send.template.questions.map((q) => ({
              id: q.id,
              label: q.label,
              type: q.type,
              required: q.required,
              order: q.order,
            })),
          }}
        />
      )}
    </div>
  );
}
