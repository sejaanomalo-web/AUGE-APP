"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { EventType } from "@prisma/client";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Field } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { createEvent, updateEvent, deleteEvent } from "@/lib/actions/events";

export interface EventFormStudent {
  id: string;
  name: string;
}

export interface EventFormInitial {
  id?: string;
  title?: string;
  type?: EventType;
  startsAt?: string; // ISO
  durationMinutes?: number | null;
  location?: string | null;
  locationUrl?: string | null;
  notes?: string | null;
  studentId?: string | null;
}

const TYPE_LABELS: Record<EventType, string> = {
  RUN_RACE: "Corrida",
  COMPETITION: "Competição",
  ONE_OFF_SESSION: "Sessão avulsa",
  EVALUATION: "Avaliação",
  OTHER: "Outro",
};

/**
 * Converte ISO → string pronta pra <input type="datetime-local"> no fuso local
 * do navegador. O input não aceita timezone, então cortamos para YYYY-MM-DDTHH:mm.
 */
function isoToLocalInput(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({
  initial,
  students,
  open: openProp,
  onOpenChange,
  redirectOnSave,
}: {
  initial?: EventFormInitial;
  students: EventFormStudent[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  redirectOnSave?: string;
}) {
  const router = useRouter();
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(true);
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };

  const isEdit = !!initial?.id;

  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [type, setType] = React.useState<EventType>(initial?.type ?? "OTHER");
  const [startsAt, setStartsAt] = React.useState(
    isoToLocalInput(initial?.startsAt),
  );
  const [duration, setDuration] = React.useState<string>(
    initial?.durationMinutes != null ? String(initial.durationMinutes) : "",
  );
  const [location, setLocation] = React.useState(initial?.location ?? "");
  const [locationUrl, setLocationUrl] = React.useState(
    initial?.locationUrl ?? "",
  );
  const [notes, setNotes] = React.useState(initial?.notes ?? "");
  const [studentId, setStudentId] = React.useState<string>(
    initial?.studentId ?? "",
  );
  const [studentSearch, setStudentSearch] = React.useState("");

  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const filteredStudents = React.useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return students;
    return students.filter((s) => s.name.toLowerCase().includes(term));
  }, [students, studentSearch]);

  const selectedStudent = students.find((s) => s.id === studentId) ?? null;

  async function handleSave() {
    setError(null);
    if (!title.trim()) {
      setError("Informe um título.");
      return;
    }
    if (!startsAt) {
      setError("Selecione data e horário.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        type,
        // input datetime-local é hora local; new Date() interpreta sem TZ.
        startsAt: new Date(startsAt),
        durationMinutes: duration ? Number(duration) : null,
        location: location || null,
        locationUrl: locationUrl || null,
        notes: notes || null,
        studentId: studentId || null,
      };
      const res = isEdit
        ? await updateEvent(initial!.id!, payload)
        : await createEvent(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      if (redirectOnSave) {
        router.push(redirectOnSave);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (!confirm("Remover este evento?")) return;
    setDeleting(true);
    try {
      const res = await deleteEvent(initial.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      if (redirectOnSave) router.push(redirectOnSave);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v && redirectOnSave) router.push(redirectOnSave);
      }}
      title={isEdit ? "Editar evento" : "Novo evento"}
      description={
        isEdit
          ? "Atualize os detalhes deste evento."
          : "Cadastre um evento na agenda. Lembretes automáticos chegam 24h e 2h antes."
      }
    >
      <div className="flex flex-col gap-4">
        {error && (
          <p className="text-body text-error" role="alert">
            {error}
          </p>
        )}

        <Field label="Título" htmlFor="evt-title">
          <Input
            id="evt-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Meia maratona Anomalia"
          />
        </Field>

        <Field label="Tipo" htmlFor="evt-type">
          <Select
            id="evt-type"
            value={type}
            onChange={(e) => setType(e.target.value as EventType)}
          >
            {(Object.keys(TYPE_LABELS) as EventType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Data e horário" htmlFor="evt-starts">
          <Input
            id="evt-starts"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </Field>

        <Field
          label="Duração (minutos)"
          htmlFor="evt-duration"
          hint="Opcional"
        >
          <Input
            id="evt-duration"
            type="number"
            inputMode="numeric"
            min={0}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Ex.: 60"
          />
        </Field>

        <Field label="Local" htmlFor="evt-location" hint="Opcional">
          <Input
            id="evt-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex.: Parque Ibirapuera"
          />
        </Field>

        <Field
          label="Link do local"
          htmlFor="evt-location-url"
          hint="Google Maps, site da prova, etc."
        >
          <Input
            id="evt-location-url"
            type="url"
            value={locationUrl}
            onChange={(e) => setLocationUrl(e.target.value)}
            placeholder="https://"
          />
        </Field>

        <Field label="Aluno" hint="Opcional. Deixe em branco para evento pessoal.">
          {selectedStudent ? (
            <div className="flex items-center justify-between gap-3 bg-bg-surface border border-border-subtle rounded-lg px-3.5 py-3">
              <span className="text-body-lg text-text-primary truncate">
                {selectedStudent.name}
              </span>
              <button
                type="button"
                onClick={() => setStudentId("")}
                className="text-caption text-accent hover:underline"
              >
                Remover
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Buscar aluno"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
              {studentSearch.trim() !== "" && (
                <div className="max-h-44 overflow-y-auto rounded-lg border border-border-subtle bg-bg-surface">
                  {filteredStudents.length === 0 ? (
                    <p className="px-3 py-2 text-caption text-text-muted">
                      Nenhum aluno encontrado.
                    </p>
                  ) : (
                    filteredStudents.slice(0, 8).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setStudentId(s.id);
                          setStudentSearch("");
                        }}
                        className="w-full text-left px-3 py-2 text-body text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                      >
                        {s.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </Field>

        <Field label="Observações" htmlFor="evt-notes" hint="Opcional">
          <Textarea
            id="evt-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Detalhes, briefing, anotações…"
          />
        </Field>

        <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
          <div>
            {isEdit && (
              <Button
                variant="destructive"
                size="md"
                onClick={handleDelete}
                disabled={saving || deleting}
              >
                {deleting ? "Removendo..." : "Remover"}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setOpen(false);
                if (redirectOnSave) router.push(redirectOnSave);
              }}
              disabled={saving || deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              disabled={saving || deleting}
            >
              {saving ? "Salvando..." : isEdit ? "Salvar" : "Criar evento"}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
