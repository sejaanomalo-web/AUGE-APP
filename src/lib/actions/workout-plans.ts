"use server";

import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notifyUser } from "@/lib/notifications/notify";

/**
 * Return-shape for actions whose errors must be readable on the client in
 * production. Next.js sanitises the message of any thrown error in a server
 * action, so structured failures travel back as data instead.
 */
export type ReplacePlanResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Check if the given user can edit a plan: must be either the trainer
 * who created it OR the student themselves when there's no trainer (solo plan).
 */
async function canEditPlan(userId: string, planId: string): Promise<boolean> {
  const plan = await prisma.workoutPlan.findUnique({ where: { id: planId } });
  if (!plan) return false;
  if (plan.trainerId === userId) return true;
  if (plan.trainerId === null && plan.studentId === userId) {
    // Solo plan: still editable by the student UNLESS they now have an
    // active trainer (in which case the trainer is responsible for plans).
    const activeLink = await prisma.trainerStudent.findFirst({
      where: { studentId: userId, status: "ACTIVE" },
    });
    return !activeLink;
  }
  return false;
}

export async function createPlan(data: {
  studentId?: string; // optional - defaults to self for solo aluno
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (!me) throw new Error("Usuário não encontrado");

  // Personal creates for a linked student; Aluno creates for self.
  let trainerId: string | null = null;
  let studentId: string;
  if (me.role === "PERSONAL") {
    if (!data.studentId) throw new Error("Selecione um aluno");
    const link = await prisma.trainerStudent.findFirst({
      where: { trainerId: userId, studentId: data.studentId, status: "ACTIVE" },
    });
    if (!link) throw new Error("Aluno não vinculado");
    trainerId = userId;
    studentId = data.studentId;
  } else {
    // Aluno: a student with an active trainer cannot self-create plans -
    // their plans are owned by the personal trainer.
    const activeLink = await prisma.trainerStudent.findFirst({
      where: { studentId: userId, status: "ACTIVE" },
    });
    if (activeLink) {
      throw new Error(
        "Você tem um personal vinculado. Apenas seu personal pode criar planos para você.",
      );
    }
    studentId = userId;
  }

  const plan = await prisma.workoutPlan.create({
    data: {
      trainerId,
      studentId,
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: true,
    },
  });

  // Só notifica se quem criou foi o personal (não auto-notificar aluno solo)
  if (trainerId && trainerId !== studentId) {
    notifyUser({
      userId: studentId,
      type: "WORKOUT_PLAN_CREATED",
      title: "Novo plano de treino",
      body: `Seu personal criou um novo plano: ${data.name}`,
      data: { planId: plan.id },
      url: "/planos",
    }).catch(() => null);
  }

  revalidatePath("/treinos");
  revalidatePath("/planos");
  return plan;
}

export async function updatePlan(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  }>,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  if (!(await canEditPlan(userId, id)))
    throw new Error("Sem permissão para editar este plano");

  await prisma.workoutPlan.update({ where: { id }, data });

  // Notifica aluno se quem editou foi o personal
  const updated = await prisma.workoutPlan.findUnique({ where: { id } });
  if (updated && updated.trainerId === userId && updated.studentId !== userId) {
    notifyUser({
      userId: updated.studentId,
      type: "WORKOUT_PLAN_UPDATED",
      title: "Plano de treino atualizado",
      body: "Seu personal fez ajustes no seu plano",
      data: { planId: id },
      url: `/planos/${id}`,
    }).catch(() => null);
  }

  revalidatePath("/treinos");
  revalidatePath("/planos");
}

/**
 * Replace an entire plan's content (metadata + sessions + exercises) in one
 * transaction. Blocks if any session has been logged by the student, since
 * deleting those rows would break the WorkoutLog FK (Restrict).
 */
export async function replacePlanContent(
  planId: string,
  data: {
    name: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    schedule: Array<{
      dayOfWeek: number;
      name: string;
      exercises: Array<{
        exerciseId: string;
        sets: number;
        reps: string;
        restSeconds?: number;
        weight?: number;
        notes?: string;
      }>;
    }>;
  },
): Promise<ReplacePlanResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Não autenticado." };

    if (!(await canEditPlan(userId, planId))) {
      return { ok: false, error: "Sem permissão para editar este plano." };
    }

    // ── Input sanity ─────────────────────────────────────────
    if (!data.name?.trim()) {
      return { ok: false, error: "Nome do plano é obrigatório." };
    }
    if (
      !(data.startDate instanceof Date) ||
      Number.isNaN(data.startDate.getTime())
    ) {
      return { ok: false, error: "Data de início inválida." };
    }
    if (
      data.endDate &&
      (!(data.endDate instanceof Date) || Number.isNaN(data.endDate.getTime()))
    ) {
      return { ok: false, error: "Data de fim inválida." };
    }
    if (!Array.isArray(data.schedule) || data.schedule.length === 0) {
      return {
        ok: false,
        error: "Atribua pelo menos um treino a um dia no cronograma semanal.",
      };
    }
    for (const row of data.schedule) {
      if (
        typeof row.dayOfWeek !== "number" ||
        row.dayOfWeek < 0 ||
        row.dayOfWeek > 6
      ) {
        return { ok: false, error: "Dia da semana inválido no cronograma." };
      }
      for (const ex of row.exercises) {
        if (!ex.exerciseId) {
          return {
            ok: false,
            error: "Existe exercício sem seleção. Confira o cronograma.",
          };
        }
      }
    }

    // Pre-check: deleting a session with logs would hit a Restrict FK and
    // tank the whole transaction. Surface a friendly message instead.
    const sessionsWithLogs = await prisma.workoutSession.findMany({
      where: { planId, logs: { some: {} } },
      select: { id: true },
    });
    if (sessionsWithLogs.length > 0) {
      return {
        ok: false,
        error:
          "Este plano já tem treinos registrados pelo aluno. Para mudar a estrutura, crie um novo plano.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.workoutPlan.update({
        where: { id: planId },
        data: {
          name: data.name.trim(),
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate ?? null,
        },
      });

      // Cascade deletes child SessionExercise rows.
      await tx.workoutSession.deleteMany({ where: { planId } });

      for (let i = 0; i < data.schedule.length; i++) {
        const s = data.schedule[i];
        const session = await tx.workoutSession.create({
          data: {
            planId,
            name: s.name,
            dayOfWeek: s.dayOfWeek,
            order: i,
          },
        });
        for (let j = 0; j < s.exercises.length; j++) {
          const ex = s.exercises[j];
          await tx.sessionExercise.create({
            data: {
              sessionId: session.id,
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps,
              restSeconds: ex.restSeconds,
              weight: ex.weight,
              notes: ex.notes,
              order: j,
            },
          });
        }
      }
    });

    // Notify the student in a fire-and-forget fashion. A failure here must
    // never invalidate the save.
    try {
      const plan = await prisma.workoutPlan.findUnique({
        where: { id: planId },
      });
      if (plan && plan.trainerId === userId && plan.studentId !== userId) {
        notifyUser({
          userId: plan.studentId,
          type: "WORKOUT_PLAN_UPDATED",
          title: "Plano atualizado",
          body: "Seu personal fez ajustes nos treinos",
          data: { planId },
          url: `/planos/${planId}`,
        }).catch((e) =>
          console.error("[replacePlanContent] notify failed", e),
        );
      }
    } catch (e) {
      console.error("[replacePlanContent] post-save notify lookup failed", e);
    }

    revalidatePath("/treinos");
    revalidatePath(`/treinos/${planId}`);
    revalidatePath("/planos");
    revalidatePath(`/planos/${planId}`);
    return { ok: true };
  } catch (err) {
    console.error("[replacePlanContent] failed", { planId, err });
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003" || err.code === "P2014") {
        return {
          ok: false,
          error:
            "Este plano já tem treinos registrados pelo aluno. Para mudar a estrutura, crie um novo plano.",
        };
      }
      if (err.code === "P2025") {
        return { ok: false, error: "Plano não encontrado." };
      }
      return { ok: false, error: `Falha ao salvar o plano (${err.code}).` };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Não conseguimos salvar o plano agora.",
    };
  }
}

export async function deletePlan(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  if (!(await canEditPlan(userId, id)))
    throw new Error("Sem permissão para excluir este plano");

  await prisma.workoutPlan.delete({ where: { id } });
  revalidatePath("/treinos");
  revalidatePath("/planos");
}

export async function getActivePlanForStudent(studentId: string) {
  return prisma.workoutPlan.findFirst({
    where: { studentId, isActive: true },
    include: {
      sessions: {
        orderBy: { order: "asc" },
        include: {
          exercises: {
            orderBy: { order: "asc" },
            include: { exercise: true },
          },
        },
      },
    },
  });
}

/**
 * Detects the "column doesn't exist" Prisma errors we get when the
 * pausedAt column hasn't been migrated yet. setPlanStatus uses this
 * to surface a clear message - getMyPlans intentionally lets the error
 * bubble up, because faking the shape made the union return type drift
 * and broke every caller's inference.
 */
function isPausedAtColumnMissing(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    (err.code === "P2022" || err.code === "P2021")
  );
}

export async function getMyPlans() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (!me) return [];

  let where:
    | { trainerId: string }
    | { studentId: string }
    | { studentId: string; trainerId: { not: null } };
  if (me.role === "PERSONAL") {
    where = { trainerId: userId };
  } else {
    // Aluno: when there's an active trainer, hide self-created solo plans -
    // only trainer-owned plans should appear.
    const activeLink = await prisma.trainerStudent.findFirst({
      where: { studentId: userId, status: "ACTIVE" },
    });
    where = activeLink
      ? { studentId: userId, trainerId: { not: null } }
      : { studentId: userId };
  }

  return prisma.workoutPlan.findMany({
    where,
    include: { sessions: { include: { exercises: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export type PlanStatus = "ACTIVE" | "PAUSED" | "INACTIVE";

export type PlanStatusResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Move a plan between the ACTIVE / PAUSED / INACTIVE states.
 *
 *   ACTIVE   - isActive = true,  pausedAt = null
 *   PAUSED   - isActive = true,  pausedAt = now()
 *   INACTIVE - isActive = false, pausedAt = null
 *
 * Only the owning trainer (or a solo aluno) can change a plan's status.
 */
export async function setPlanStatus(
  planId: string,
  status: PlanStatus,
): Promise<PlanStatusResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Não autenticado." };

    if (!(await canEditPlan(userId, planId))) {
      return { ok: false, error: "Sem permissão para alterar este plano." };
    }

    const data =
      status === "ACTIVE"
        ? { isActive: true, pausedAt: null }
        : status === "PAUSED"
          ? { isActive: true, pausedAt: new Date() }
          : { isActive: false, pausedAt: null };

    try {
      await prisma.workoutPlan.update({ where: { id: planId }, data });
    } catch (err) {
      if (isPausedAtColumnMissing(err)) {
        return {
          ok: false,
          error:
            "Coluna pausedAt ainda não migrada. Aplique a migration 20260524_workoutplan_paused no banco para usar este recurso.",
        };
      }
      throw err;
    }

    revalidatePath("/treinos");
    revalidatePath(`/treinos/${planId}`);
    revalidatePath("/planos");
    return { ok: true };
  } catch (err) {
    console.error("[setPlanStatus] failed", { planId, status, err });
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao atualizar status.",
    };
  }
}

export async function getPlanById(id: string) {
  return prisma.workoutPlan.findUnique({
    where: { id },
    include: {
      sessions: {
        orderBy: { order: "asc" },
        include: {
          exercises: {
            orderBy: { order: "asc" },
            include: { exercise: true },
          },
        },
      },
    },
  });
}
