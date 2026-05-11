"use client";

import * as React from "react";
import { Check, FileText, Loader2, Paperclip, Upload } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  getMetricAttachmentSignedUrl,
  logPlanMetric,
} from "@/lib/actions/plan-metrics";
import { formatRelativeFromNow } from "@/lib/date";

export interface PlanMetricDef {
  id: string;
  name: string;
  unit: string | null;
  requiresAttachment: boolean;
}

export interface PlanMetricLogRow {
  id: string;
  definitionId: string;
  value: string;
  attachmentKey: string | null;
  date: string; // ISO
}

export function PlanMetricsSection({
  metrics,
  logs,
}: {
  metrics: PlanMetricDef[];
  logs: PlanMetricLogRow[];
}) {
  const nowIso = new Date().toISOString();

  if (metrics.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="text-h3 text-text-primary mb-3">Métricas do plano</h2>
      <p className="text-caption text-text-muted mb-3">
        Campos pedidos pelo seu personal para acompanhar sua evolução.
      </p>

      <div className="flex flex-col gap-3">
        {metrics.map((m) => {
          const myLogs = logs.filter((l) => l.definitionId === m.id);
          return (
            <MetricRow key={m.id} def={m} logs={myLogs} nowIso={nowIso} />
          );
        })}
      </div>
    </section>
  );
}

function MetricRow({
  def,
  logs,
  nowIso,
}: {
  def: PlanMetricDef;
  logs: PlanMetricLogRow[];
  nowIso: string;
}) {
  const [value, setValue] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const lastLog = logs[0];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!value.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("definitionId", def.id);
      formData.append("value", value.trim());
      if (file) formData.append("file", file);
      await logPlanMetric(formData);
      setValue("");
      setFile(null);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
      setSubmitting(false);
    }
  }

  async function openAttachment(logId: string) {
    try {
      const url = await getMetricAttachmentSignedUrl(logId);
      window.open(url, "_blank");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <Card variant="default">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="text-body-lg font-semibold text-text-primary">
            {def.name}
            {def.unit && (
              <span className="ml-1.5 text-caption text-text-muted font-normal">
                ({def.unit})
              </span>
            )}
          </p>
          {def.requiresAttachment && (
            <Badge variant="info" className="mt-1">
              <Paperclip size={11} aria-hidden /> Anexo obrigatório
            </Badge>
          )}
        </div>
        {lastLog && (
          <span className="text-caption text-text-muted text-right shrink-0">
            Último:{" "}
            <span className="text-text-primary font-semibold tnum">
              {lastLog.value}
              {def.unit ? ` ${def.unit}` : ""}
            </span>
            <br />
            {formatRelativeFromNow(lastLog.date, nowIso)}
          </span>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3"
        encType="multipart/form-data"
      >
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Novo valor${def.unit ? ` em ${def.unit}` : ""}`}
            className="flex-1"
            required
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={submitting}
            className="shrink-0"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} aria-hidden />
            )}
            Registrar
          </Button>
        </div>
        <label
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors text-caption",
            file
              ? "bg-success/10 text-success"
              : "bg-bg-elevated text-text-secondary hover:bg-bg-hover",
          )}
        >
          <Upload size={14} aria-hidden />
          <span className="flex-1 truncate">
            {file
              ? file.name
              : def.requiresAttachment
                ? "Selecionar anexo (obrigatório)"
                : "Selecionar anexo (opcional)"}
          </span>
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error && (
          <p className="text-caption text-error" role="alert">
            {error}
          </p>
        )}
      </form>

      {logs.length > 0 && (
        <details className="mt-4 group">
          <summary className="cursor-pointer text-caption text-text-secondary hover:text-text-primary list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform">
              ▸
            </span>
            Histórico ({logs.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {logs.map((l) => (
              <li
                key={l.id}
                className="flex items-center gap-2 px-2 py-1.5 text-caption text-text-secondary"
              >
                <span className="font-semibold text-text-primary tnum">
                  {l.value}
                  {def.unit ? ` ${def.unit}` : ""}
                </span>
                <span className="text-text-muted">
                  {formatRelativeFromNow(l.date, nowIso)}
                </span>
                {l.attachmentKey && (
                  <button
                    type="button"
                    onClick={() => openAttachment(l.id)}
                    className="ml-auto text-accent hover:underline inline-flex items-center gap-1"
                  >
                    <FileText size={12} aria-hidden /> Anexo
                  </button>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}
