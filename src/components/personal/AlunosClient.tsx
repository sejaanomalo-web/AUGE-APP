"use client";

import * as React from "react";
import Link from "next/link";
import { Copy, Plus, Search, Users, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatLongDate } from "@/lib/date";
import { createInviteCode, revokeInvite } from "@/lib/actions/invites";

export interface AlunoSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: "ACTIVE" | "PAUSED";
  startedAt: string;
  activePlanName: string | null;
}

export interface InviteRow {
  id: string;
  code: string;
  status: "ACTIVE" | "USED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
  createdAt: string;
}

export function AlunosClient({
  students,
  invites,
}: {
  students: AlunoSummary[];
  invites: InviteRow[];
}) {
  const [q, setQ] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("todos");
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [generated, setGenerated] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const filtered = students.filter((s) => {
    const matchQ = q === "" || s.name.toLowerCase().includes(q.toLowerCase());
    const matchStatus =
      statusFilter === "todos" || s.status === statusFilter;
    return matchQ && matchStatus;
  });

  const activeInvites = invites.filter((i) => i.status === "ACTIVE");

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const inv = await createInviteCode();
      setGenerated(inv.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar código");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revogar este convite? Ele não poderá mais ser usado."))
      return;
    try {
      await revokeInvite(id);
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    }
  }

  function copyCode() {
    if (!generated) return;
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            aria-hidden
          />
          <Input
            placeholder="Buscar aluno"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10 rounded-pill"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:max-w-[200px]"
        >
          <option value="todos">Todos os status</option>
          <option value="ACTIVE">Ativos</option>
          <option value="PAUSED">Pausados</option>
        </Select>
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setGenerated(null);
            setError(null);
            setInviteOpen(true);
          }}
        >
          <Plus size={18} aria-hidden /> Novo convite
        </Button>
      </div>

      {activeInvites.length > 0 && (
        <Card variant="default" className="mb-6">
          <h3 className="text-h3 text-text-primary mb-3">
            Convites ativos
          </h3>
          <ul className="flex flex-col gap-2">
            {activeInvites.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <code className="text-h3 font-bold tnum tracking-normal text-accent">
                    {inv.code}
                  </code>
                  <span className="text-caption text-text-muted">
                    expira em {formatLongDate(inv.expiresAt)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(inv.id)}
                  className="text-text-muted hover:text-error"
                  aria-label="Revogar convite"
                >
                  <X size={16} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {filtered.length === 0 ? (
        students.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum aluno vinculado"
            description="Gere um código de convite e compartilhe com um aluno para vinculá-lo."
            action={
              <Button
                variant="primary"
                size="md"
                onClick={() => setInviteOpen(true)}
              >
                <Plus size={16} aria-hidden /> Gerar convite
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Users}
            title="Nenhum aluno encontrado"
            description="Tente ajustar os filtros."
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((s) => (
            <Link key={s.id} href={`/alunos/${s.id}`} className="block">
              <Card variant="interactive" className="min-h-[150px]">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar
                    src={s.avatarUrl ?? undefined}
                    name={s.name}
                    size={48}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-lg text-text-primary font-semibold truncate">
                      {s.name}
                    </p>
                  <p className="text-caption text-text-secondary truncate">
                    {s.activePlanName ?? "Sem plano ativo"}
                  </p>
                </div>
                  <Badge
                    variant={s.status === "ACTIVE" ? "concluido" : "pulado"}
                  >
                    {s.status === "ACTIVE" ? "Ativo" : "Pausado"}
                  </Badge>
                </div>
                <p className="text-caption text-text-muted">
                  Acompanhamento desde {formatLongDate(s.startedAt)}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog
        open={inviteOpen}
        onOpenChange={(o) => {
          setInviteOpen(o);
          if (!o) setGenerated(null);
        }}
        title="Gerar código de convite"
        description="Gere um código de 6 caracteres e compartilhe com o aluno. O código expira em 7 dias."
      >
        {generated ? (
          <div className="flex flex-col items-center gap-4 py-2">
            <code className="text-display tnum font-bold tracking-normal text-accent">
              {generated}
            </code>
            <Button variant="secondary" size="md" onClick={copyCode}>
              <Copy size={16} aria-hidden /> {copied ? "Copiado!" : "Copiar"}
            </Button>
            <p className="text-caption text-text-muted text-center max-w-xs">
              Compartilhe com o aluno. Ele cola no cadastro para vincular
              automaticamente.
            </p>
            <div className="flex gap-3 mt-4">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setGenerated(null);
                  setInviteOpen(false);
                }}
              >
                Fechar
              </Button>
              <Button variant="primary" size="md" onClick={handleGenerate}>
                Gerar outro
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {error && (
              <p className="text-body text-error" role="alert">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setInviteOpen(false)}
                disabled={generating}
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
        )}
      </Dialog>
    </>
  );
}
