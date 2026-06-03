"use client";

import * as React from "react";
import { Copy, Plus, Users, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  createNutriInviteCode,
  revokeNutriInvite,
} from "@/lib/actions/nutri-invites";

export interface AlunoNutriRow {
  linkId: string;
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  startedAt: string;
}

export interface NutriInviteRow {
  id: string;
  code: string;
  status: "ACTIVE" | "USED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
  createdAt: string;
}

export function NutriAlunosClient({
  students,
  invites,
}: {
  students: AlunoNutriRow[];
  invites: NutriInviteRow[];
}) {
  const [open, setOpen] = React.useState(false);
  const [generated, setGenerated] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const activeInvites = invites.filter((i) => i.status === "ACTIVE");

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const inv = await createNutriInviteCode();
      setGenerated(inv.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar código");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revogar este convite? Ele não poderá mais ser usado."))
      return;
    try {
      await revokeNutriInvite(id);
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-h2 text-text-primary">Vinculados</h2>
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setGenerated(null);
            setError(null);
            setOpen(true);
          }}
        >
          <Plus size={16} aria-hidden /> Convidar aluno
        </Button>
      </div>

      {students.length === 0 ? (
        <Card variant="default">
          <EmptyState
            icon={Users}
            title="Nenhum aluno vinculado"
            description="Gere um código de convite e envie pro seu aluno. Quando ele inserir o código, vocês ficam vinculados aqui."
            action={
              <Button
                variant="primary"
                size="md"
                onClick={() => setOpen(true)}
              >
                <Plus size={16} aria-hidden /> Convidar aluno
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {students.map((s) => (
            <Card key={s.id} variant="default">
              <div className="flex items-center gap-3">
                <Avatar src={s.avatarUrl ?? undefined} name={s.name} size={44} />
                <div className="min-w-0">
                  <p className="text-body-lg font-semibold text-text-primary truncate">
                    {s.name}
                  </p>
                  <p className="text-caption text-text-muted truncate">
                    {s.email}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeInvites.length > 0 && (
        <section>
          <h2 className="text-h2 text-text-primary mb-3">Convites ativos</h2>
          <div className="flex flex-col gap-2">
            {activeInvites.map((i) => (
              <Card key={i.id} variant="default" className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <code className="text-body font-bold text-text-primary tnum bg-bg-elevated px-3 py-1 rounded">
                      {i.code}
                    </code>
                    <Badge variant="concluido">ativo</Badge>
                    <span className="text-caption text-text-muted truncate">
                      Expira em {i.expiresAt}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopy(i.code)}
                      aria-label="Copiar código"
                    >
                      <Copy size={14} aria-hidden />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRevoke(i.id)}
                      aria-label="Revogar convite"
                    >
                      <X size={14} aria-hidden />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            setGenerated(null);
            setError(null);
            setCopied(false);
          }
          setOpen(o);
        }}
        title="Convidar aluno"
        description={
          generated
            ? "Compartilhe esse código com seu aluno. Ele tem 7 dias pra usar."
            : "Gere um código único de 6 caracteres pro seu aluno digitar no app dele."
        }
      >
        {!generated ? (
          <div className="flex flex-col gap-4">
            {error && (
              <p className="text-body text-error" role="alert">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? "Gerando..." : "Gerar código"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 items-center">
            <code className="text-h1 font-bold text-accent tnum bg-bg-elevated px-8 py-4 rounded-xl tracking-widest">
              {generated}
            </code>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => handleCopy(generated)}
              >
                <Copy size={16} aria-hidden />
                {copied ? "Copiado!" : "Copiar"}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setOpen(false);
                  window.location.reload();
                }}
              >
                Pronto
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
