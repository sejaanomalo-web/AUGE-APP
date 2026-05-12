"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notifyUser } from "@/lib/notifications/notify";

/**
 * Check if the given user can edit a plan: must be either the trainer
 * who created it OR the student themselves when there's no trainer (solo plan).
 */
async function canEditPlan(userId: string, planId: string): Promise<boolean> {
  const plan = await prisma.workoutPlan.findUnique({ where: { id: planId } });
  if (!plan) return false;
  if (plan.trainerId === userId) return true;
  if (plan.trainerId === null && plan.studentId === userId) return true;
  return false;
}

export async function createPlan(data: {
  studentId?: string; // optional — defaults to self for solo aluno
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
    // Aluno
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
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  if (!(await canEditPlan(userId, planId)))
    throw new Error("Sem permissão para editar este plano");

  const sessionsWithLogs = await prisma.workoutSession.findMany({
    where: { planId, logs: { some: {} } },
    select: { id: true },
  });
  if (sessionsWithLogs.length > 0) {
    throw new Error(
      "Este plano já tem treinos registrados pelo aluno. Para mudar a estrutura, crie um novo plano.",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.workoutPlan.update({
      where: { id: planId },
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
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

  const plan = await prisma.workoutPlan.findUnique({ where: { id: planId } });
  if (plan && plan.trainerId === userId && plan.studentId !== userId) {
    notifyUser({
      userId: plan.studentId,
      type: "WORKOUT_PLAN_UPDATED",
      title: "Plano atualizado",
      body: "Seu personal fez ajustes nos treinos",
      data: { planId },
      url: `/planos/${planId}`,
    }).catch(() => null);
  }

  revalidatePath("/treinos");
  revalidatePath(`/treinos/${planId}`);
  revalidatePath("/planos");
  revalidatePath(`/planos/${planId}`);
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

export async function getMyPlans() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (!me) return [];

  const where =
    me.role === "PERSONAL"
      ? { trainerId: userId }
      : { studentId: userId };

  return prisma.workoutPlan.findMany({
    where,
    include: { sessions: { include: { exercises: true } } },
    orderBy: { createdAt: "desc" },
  });
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
