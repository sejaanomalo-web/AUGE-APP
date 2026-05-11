"use client";

import * as React from "react";
import Link from "next/link";
import { Activity, Download, FileText, Plus, Upload, Trash2 } from "lucide-react";
import { LinkButton } from "@/components/ui/LinkButton";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input, Label } from "@/components/ui/Input";
import { formatLongDate, formatShortDate } from "@/lib/date";
import { uploadExam, getExamSignedUrl, deleteExam } from "@/lib/actions/exams";

interface MetricRow {
  id: string;
  date: string;
  weight: number | null;
  bodyFat: number | null;
  waist: number | null;
  arm: number | null;
  thigh: number | null;
}

interface ExamRow {
  id: string;
  date: string;
  type: string;
  fileName: string;
}

export function MedidasView({
  metrics,
  exams,
}: {
  metrics: MetricRow[];
  exams: ExamRow[];
}) {
  const latest = metrics[0];
  const prev = metrics[1];
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const delta = (cur?: number | null, p?: number | null) =>
    cur != null && p != null ? +(cur - p).toFixed(1) : null;

  async function onUploadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData(e.currentTarget);
      await uploadExam(formData);
      setUploadOpen(false);
      window.location.reload();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setUploading(false);
    }
  }

  async function openExam(id: string) {
    try {
      const url = await getExamSignedUrl(id);
      window.open(url, "_blank");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao abrir exame");
    }
  }

  async function removeExam(id: string) {
    if (!confirm("Tem certeza? Esta ação remove o arquivo permanentemente."))
      return;
    try {
      await deleteExam(id);
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao remover");
    }
  }

  return (
    <Tabs defaultValue="medidas">
      <TabsList>
        <TabsTrigger value="medidas">Medidas</TabsTrigger>
        <TabsTrigger value="exames">Exames</TabsTrigger>
      </TabsList>

      <TabsContent value="medidas">
        {metrics.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Nenhuma medida registrada"
            description="Adicione sua primeira medida corporal para acompanhar sua evolução."
            action={
              <LinkButton href="/medidas/novo" variant="primary" size="md">
                <Plus size={16} aria-hidden /> Nova medida
              </LinkButton>
            }
          />
        ) : (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {latest.weight != null && (
                <StatCard
                  label="Peso"
                  value={`${latest.weight.toFixed(1)} kg`}
                  delta={
                    delta(latest.weight, prev?.weight) != null
                      ? {
                          value: `${delta(latest.weight, prev?.weight)! > 0 ? "+" : ""}${delta(latest.weight, prev?.weight)} kg`,
                          positive:
                            (delta(latest.weight, prev?.weight) ?? 0) <= 0,
                        }
                      : undefined
                  }
                  hint={prev ? "vs anterior" : undefined}
                />
              )}
              {latest.bodyFat != null && (
                <StatCard
                  label="% Gordura"
                  value={`${latest.bodyFat.toFixed(1)}%`}
                  delta={
                    delta(latest.bodyFat, prev?.bodyFat) != null
                      ? {
                          value: `${delta(latest.bodyFat, prev?.bodyFat)! > 0 ? "+" : ""}${delta(latest.bodyFat, prev?.bodyFat)}%`,
                          positive:
                            (delta(latest.bodyFat, prev?.bodyFat) ?? 0) <= 0,
                        }
                      : undefined
                  }
                  hint={prev ? "vs anterior" : undefined}
                />
              )}
              {latest.waist != null && (
                <StatCard
                  label="Cintura"
                  value={`${latest.waist.toFixed(1)} cm`}
                  delta={
                    delta(latest.waist, prev?.waist) != null
                      ? {
                          value: `${delta(latest.waist, prev?.waist)! > 0 ? "+" : ""}${delta(latest.waist, prev?.waist)} cm`,
                          positive: (delta(latest.waist, prev?.waist) ?? 0) <= 0,
                        }
                      : undefined
                  }
                  hint={prev ? "vs anterior" : undefined}
                />
              )}
              {latest.arm != null && (
                <StatCard
                  label="Braço"
                  value={`${latest.arm.toFixed(1)} cm`}
                  delta={
                    delta(latest.arm, prev?.arm) != null
                      ? {
                          value: `${delta(latest.arm, prev?.arm)! > 0 ? "+" : ""}${delta(latest.arm, prev?.arm)} cm`,
                          positive: (delta(latest.arm, prev?.arm) ?? 0) >= 0,
                        }
                      : undefined
                  }
                  hint={prev ? "vs anterior" : undefined}
                />
              )}
            </section>

            <Card variant="default" className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-body tnum">
                  <thead>
                    <tr className="text-caption text-text-muted uppercase tracking-[0.08em] border-b border-border-subtle">
                      <th className="text-left p-3 font-medium">Data</th>
                      <th className="text-right p-3 font-medium">Peso</th>
                      <th className="text-right p-3 font-medium">% Gord.</th>
                      <th className="text-right p-3 font-medium">Cintura</th>
                      <th className="text-right p-3 font-medium">Braço</th>
                      <th className="text-right p-3 font-medium">Coxa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m, i) => (
                      <tr
                        key={m.id}
                        className={
                          i === 0
                            ? "border-b border-border-subtle bg-bg-elevated/40"
                            : "border-b border-border-subtle/60"
                        }
                      >
                        <td className="p-3 text-text-secondary">
                          {formatShortDate(m.date)}
                        </td>
                        <td className="p-3 text-right text-text-primary">
                          {m.weight != null ? m.weight.toFixed(1) : "—"}
                        </td>
                        <td className="p-3 text-right text-text-primary">
                          {m.bodyFat != null ? `${m.bodyFat.toFixed(1)}%` : "—"}
                        </td>
                        <td className="p-3 text-right text-text-primary">
                          {m.waist != null ? m.waist.toFixed(1) : "—"}
                        </td>
                        <td className="p-3 text-right text-text-primary">
                          {m.arm != null ? m.arm.toFixed(1) : "—"}
                        </td>
                        <td className="p-3 text-right text-text-primary">
                          {m.thigh != null ? m.thigh.toFixed(1) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </TabsContent>

      <TabsContent value="exames">
        <div className="flex justify-end mb-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setUploadError(null);
              setUploadOpen(true);
            }}
          >
            <Upload size={16} aria-hidden /> Anexar exame
          </Button>
        </div>

        {exams.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum exame anexado"
            description="Anexe seu primeiro exame (PDF, JPG ou PNG) — só você e seu personal vinculado terão acesso."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {exams.map((e) => (
              <li key={e.id}>
                <Card variant="default" className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-md bg-bg-elevated flex items-center justify-center shrink-0">
                    <FileText size={20} className="text-accent" aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-lg font-semibold text-text-primary truncate">
                      {e.type}
                    </p>
                    <p className="text-caption text-text-muted truncate">
                      {formatLongDate(e.date)} · {e.fileName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openExam(e.id)}
                    aria-label={`Baixar ${e.type}`}
                    className="text-text-secondary hover:text-text-primary"
                  >
                    <Download size={20} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeExam(e.id)}
                    aria-label={`Remover ${e.type}`}
                    className="text-text-muted hover:text-error"
                  >
                    <Trash2 size={18} aria-hidden />
                  </button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      <Dialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Anexar exame"
        description="PDF, JPEG ou PNG até 10MB. Apenas você e seu personal vinculado têm acesso."
      >
        <form
          onSubmit={onUploadSubmit}
          className="flex flex-col gap-4"
          encType="multipart/form-data"
        >
          <Field label="Tipo do exame" htmlFor="exam-type">
            <Input
              id="exam-type"
              name="type"
              placeholder="ex: Hemograma completo"
              required
            />
          </Field>
          <Field label="Data" htmlFor="exam-date">
            <Input
              id="exam-date"
              name="date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </Field>
          <div>
            <Label htmlFor="exam-file">Arquivo</Label>
            <Input
              id="exam-file"
              name="file"
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              required
              className="py-3"
            />
          </div>
          <Field label="Observações (opcional)" htmlFor="exam-notes">
            <Input id="exam-notes" name="notes" />
          </Field>

          {uploadError && (
            <p className="text-body text-error" role="alert">
              {uploadError}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 mt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setUploadOpen(false)}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={uploading}
            >
              {uploading ? "Enviando..." : "Anexar"}
            </Button>
          </div>
        </form>
      </Dialog>
    </Tabs>
  );
}
