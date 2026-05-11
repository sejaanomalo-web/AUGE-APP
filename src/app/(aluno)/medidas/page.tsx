"use client";

import Link from "next/link";
import { Download, FileText, Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/shared/StatCard";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input, Label } from "@/components/ui/Input";
import { bodyMetrics, exams } from "@/lib/mock-data";
import { formatLongDate, formatShortDate } from "@/lib/date";
import * as React from "react";

export default function MedidasPage() {
  const sorted = [...bodyMetrics].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const latest = sorted[0];
  const prev = sorted[1];
  const delta = (cur: number, p: number) => +(cur - p).toFixed(1);

  const [uploadOpen, setUploadOpen] = React.useState(false);

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Medidas"
        subtitle="Acompanhe sua evolução corporal"
        actions={
          <LinkButton href="/medidas/novo" variant="primary" size="md">
            <Plus size={18} aria-hidden /> Nova medida
          </LinkButton>
        }
      />

      <Tabs defaultValue="medidas">
        <TabsList>
          <TabsTrigger value="medidas">Medidas</TabsTrigger>
          <TabsTrigger value="exames">Exames</TabsTrigger>
        </TabsList>

        <TabsContent value="medidas">
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="Peso"
              value={`${latest.weightKg.toFixed(1)} kg`}
              delta={{
                value: `${delta(latest.weightKg, prev.weightKg) > 0 ? "+" : ""}${delta(latest.weightKg, prev.weightKg)} kg`,
                positive: latest.weightKg <= prev.weightKg,
              }}
              hint="vs semana anterior"
            />
            <StatCard
              label="% Gordura"
              value={`${latest.bodyFatPercent.toFixed(1)}%`}
              delta={{
                value: `${delta(latest.bodyFatPercent, prev.bodyFatPercent) > 0 ? "+" : ""}${delta(latest.bodyFatPercent, prev.bodyFatPercent)}%`,
                positive: latest.bodyFatPercent <= prev.bodyFatPercent,
              }}
              hint="vs semana anterior"
            />
            <StatCard
              label="Cintura"
              value={`${latest.waistCm.toFixed(1)} cm`}
              delta={{
                value: `${delta(latest.waistCm, prev.waistCm) > 0 ? "+" : ""}${delta(latest.waistCm, prev.waistCm)} cm`,
                positive: latest.waistCm <= prev.waistCm,
              }}
              hint="vs semana anterior"
            />
            <StatCard
              label="Braço"
              value={`${latest.armCm.toFixed(1)} cm`}
              delta={{
                value: `${delta(latest.armCm, prev.armCm) > 0 ? "+" : ""}${delta(latest.armCm, prev.armCm)} cm`,
                positive: latest.armCm >= prev.armCm,
              }}
              hint="vs semana anterior"
            />
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
                  {sorted.map((m, i) => (
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
                        {m.weightKg.toFixed(1)}
                      </td>
                      <td className="p-3 text-right text-text-primary">
                        {m.bodyFatPercent.toFixed(1)}%
                      </td>
                      <td className="p-3 text-right text-text-primary">
                        {m.waistCm.toFixed(1)}
                      </td>
                      <td className="p-3 text-right text-text-primary">
                        {m.armCm.toFixed(1)}
                      </td>
                      <td className="p-3 text-right text-text-primary">
                        {m.thighCm.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="exames">
          <div className="flex justify-end mb-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setUploadOpen(true)}
            >
              <Upload size={16} aria-hidden /> Anexar exame
            </Button>
          </div>
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
                    <p className="text-caption text-text-muted">
                      {formatLongDate(e.date)}
                    </p>
                  </div>
                  <Link
                    href={e.fileUrl}
                    aria-label={`Baixar ${e.type}`}
                    className="text-text-secondary hover:text-text-primary"
                  >
                    <Download size={20} aria-hidden />
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>

      <Dialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Anexar exame"
        description="Selecione o tipo do exame e envie o arquivo (mock)."
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setUploadOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setUploadOpen(false)}
            >
              Anexar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Tipo do exame" htmlFor="exam-type">
            <Input id="exam-type" placeholder="ex: Hemograma completo" />
          </Field>
          <div>
            <Label>Arquivo</Label>
            <div className="border border-dashed border-border rounded-md py-8 px-4 text-center text-caption text-text-muted">
              Arraste o PDF ou clique para selecionar
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
