"use server";

import { revalidatePath } from "next/cache";
import type { EventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

export type EventResult<T = void> =
  | (T extends void ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

export interface EventWithStudent {
  id: string;
  title: string;
  type: EventType;
  startsAt: string; // ISO
  durationMinutes: number | null;
  location: string | null;
  locationUrl: string | null;
  notes: string | null;
  remindersHours: number[];
  studentId: string | null;
  studentName: string | null;
  studentAvatarUrl: string | null;
}

function toDto(e: {
  id: string;
  title: string;
  type: EventType;
  startsAt: Date;
  durationMinutes: number | null;
  location: string | null;
  locationUrl: string | null;
  notes: string | null;
  remindersHours: number[];
  studentId: string | null;
  student: { name: string; avatarUrl: string | null } | null;
}): EventWithStudent {
  return {
    id: e.id,
    title: e.title,
    type: e.type,
    startsAt: e.startsAt.toISOString(),
    durationMinutes: e.durationMinutes,
    location: e.location,
    locationUrl: e.locationUrl,
    notes: e.notes,
    remindersHours: e.remindersHours,
    studentId: e.studentId,
    studentName: e.student?.name ?? null,
    studentAvatarUrl: e.student?.avatarUrl ?? null,
  };
}

export async function listMyEvents(opts?: {
  from?: Date;
  to?: Date;
  studentId?: string;
}): Promise<EventWithStudent[]> {
  const user = await requireRole("PERSONAL");
  const where: Record<string, unknown> = { trainerId: user.id };
  if (opts?.studentId) where.studentId = opts.studentId;
  if (opts?.from || opts?.to) {
    const range: Record<string, Date> = {};
    if (opts.from) range.gte = opts.from;
    if (opts.to) range.lte = opts.to;
    where.startsAt = range;
  }
  const events = await prisma.event.findMany({
    where,
    include: {
      student: { select: { name: true, avatarUrl: true } },
    },
    orderBy: { startsAt: "asc" },
  });
  return events.map(toDto);
}

/** Próximos 5 eventos do aluno (lembretes/competições do personal envolvendo ele). */
export async function listMyStudentEvents(): Promise<EventWithStudent[]> {
  const user = await requireRole("ALUNO");
  const now = new Date();
  const events = await prisma.event.findMany({
    where: { studentId: user.id, startsAt: { gte: now } },
    include: {
      student: { select: { name: true, avatarUrl: true } },
    },
    orderBy: { startsAt: "asc" },
    take: 5,
  });
  return events.map(toDto);
}

export async function createEvent(data: {
  title: string;
  type: EventType;
  startsAt: Date | string;
  durationMinutes?: number | null;
  location?: string | null;
  locationUrl?: string | null;
  notes?: string | null;
  studentId?: string | null;
  /** Vários alunos no mesmo evento: cria um evento por aluno selecionado. */
  studentIds?: string[];
  remindersHours?: number[];
}): Promise<EventResult<{ id: string }>> {
  try {
    const user = await requireRole("PERSONAL");
    const title = data.title?.trim();
    if (!title) return { ok: false, error: "Informe um título para o evento." };

    const startsAt =
      typeof data.startsAt === "string" ? new Date(data.startsAt) : data.startsAt;
    if (!startsAt || Number.isNaN(startsAt.getTime())) {
      return { ok: false, error: "Data inválida." };
    }

    // Alunos do evento: aceita lista (multi) ou o campo único (compat). Sem
    // nenhum aluno = evento pessoal do personal.
    const studentIds = Array.from(
      new Set(
        data.studentIds && data.studentIds.length > 0
          ? data.studentIds
          : data.studentId
            ? [data.studentId]
            : [],
      ),
    );

    // Garante que TODOS os alunos pertencem a este personal.
    if (studentIds.length > 0) {
      const links = await prisma.trainerStudent.findMany({
        where: { trainerId: user.id, studentId: { in: studentIds } },
        select: { studentId: true },
      });
      const linked = new Set(links.map((l) => l.studentId));
      if (studentIds.some((id) => !linked.has(id))) {
        return { ok: false, error: "Aluno não vinculado a você." };
      }
    }

    const reminders =
      Array.isArray(data.remindersHours) && data.remindersHours.length > 0
        ? Array.from(new Set(data.remindersHours.filter((n) => n > 0))).sort(
            (a, b) => b - a,
          )
        : [24, 2];

    const base = {
      trainerId: user.id,
      title,
      type: data.type,
      startsAt,
      durationMinutes: data.durationMinutes ?? null,
      location: data.location?.trim() || null,
      locationUrl: data.locationUrl?.trim() || null,
      notes: data.notes?.trim() || null,
      remindersHours: reminders,
    };

    // Um evento por aluno (cada um recebe seus próprios lembretes); ou um
    // evento pessoal quando nenhum aluno foi escolhido.
    const targets: (string | null)[] =
      studentIds.length > 0 ? studentIds : [null];
    const created = await prisma.$transaction(
      targets.map((sid) =>
        prisma.event.create({
          data: { ...base, studentId: sid },
          select: { id: true },
        }),
      ),
    );

    revalidatePath("/eventos");
    for (const sid of studentIds) revalidatePath(`/alunos/${sid}`);
    return { ok: true, data: { id: created[0]?.id ?? "" } };
  } catch (err) {
    console.error("[createEvent] failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao criar evento.",
    };
  }
}

export async function updateEvent(
  id: string,
  data: Partial<{
    title: string;
    type: EventType;
    startsAt: Date | string;
    durationMinutes: number | null;
    location: string | null;
    locationUrl: string | null;
    notes: string | null;
    studentId: string | null;
    remindersHours: number[];
  }>,
): Promise<EventResult> {
  try {
    const user = await requireRole("PERSONAL");
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing || existing.trainerId !== user.id) {
      return { ok: false, error: "Evento não encontrado." };
    }

    if (data.studentId) {
      const link = await prisma.trainerStudent.findFirst({
        where: { trainerId: user.id, studentId: data.studentId },
        select: { id: true },
      });
      if (!link) return { ok: false, error: "Aluno não vinculado a você." };
    }

    const patch: Record<string, unknown> = {};
    if (data.title !== undefined) patch.title = data.title.trim();
    if (data.type !== undefined) patch.type = data.type;
    if (data.startsAt !== undefined) {
      const s =
        typeof data.startsAt === "string"
          ? new Date(data.startsAt)
          : data.startsAt;
      if (!s || Number.isNaN(s.getTime())) {
        return { ok: false, error: "Data inválida." };
      }
      patch.startsAt = s;
      // Mudou data → zera marcações de lembrete já disparadas pra reagendar.
      patch.remindersFired = {};
    }
    if (data.durationMinutes !== undefined)
      patch.durationMinutes = data.durationMinutes;
    if (data.location !== undefined)
      patch.location = data.location?.trim() || null;
    if (data.locationUrl !== undefined)
      patch.locationUrl = data.locationUrl?.trim() || null;
    if (data.notes !== undefined) patch.notes = data.notes?.trim() || null;
    if (data.studentId !== undefined) patch.studentId = data.studentId ?? null;
    if (data.remindersHours !== undefined) {
      patch.remindersHours =
        data.remindersHours.length > 0
          ? Array.from(new Set(data.remindersHours.filter((n) => n > 0))).sort(
              (a, b) => b - a,
            )
          : [24, 2];
    }

    await prisma.event.update({ where: { id }, data: patch });
    revalidatePath("/eventos");
    revalidatePath(`/eventos/${id}`);
    if (existing.studentId) revalidatePath(`/alunos/${existing.studentId}`);
    if (data.studentId) revalidatePath(`/alunos/${data.studentId}`);
    return { ok: true };
  } catch (err) {
    console.error("[updateEvent] failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao atualizar evento.",
    };
  }
}

export async function deleteEvent(id: string): Promise<EventResult> {
  try {
    const user = await requireRole("PERSONAL");
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing || existing.trainerId !== user.id) {
      return { ok: false, error: "Evento não encontrado." };
    }
    await prisma.event.delete({ where: { id } });
    revalidatePath("/eventos");
    if (existing.studentId) revalidatePath(`/alunos/${existing.studentId}`);
    return { ok: true };
  } catch (err) {
    console.error("[deleteEvent] failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao remover evento.",
    };
  }
}
