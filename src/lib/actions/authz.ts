import "server-only";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Centralised authorization guards for Server Actions.
 *
 * WHY THIS EXISTS: every Server Action reaches Postgres through the Prisma
 * client, which connects with the Supabase `service_role` and therefore
 * BYPASSES Row Level Security. RLS is only a second line of defence (it
 * protects the browser `anon` key used by the Realtime notification channel).
 * The real access control for the app lives HERE, in application code. An
 * action that accepts an `id`/`planId`/`sessionId` and does not verify the
 * caller's relationship to it is an IDOR: any authenticated user can invoke
 * the action (Server Actions are POST endpoints) with someone else's id.
 *
 * MULTI-PERSONAL READY: a student may have MORE THAN ONE active trainer
 * (e.g. one for the gym, one for running). Every trainer check below queries
 * the `TrainerStudent` M2M table with `findFirst(status: ACTIVE)`, which is
 * naturally correct for N trainers — it answers "is THIS caller one of the
 * student's active trainers?" without assuming a single link.
 */

export class AuthzError extends Error {
  constructor(message = "Sem permissão") {
    super(message);
    this.name = "AuthzError";
  }
}

/** Resolve the authenticated Clerk user id or throw. */
export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new AuthzError("Não autenticado");
  return userId;
}

/** True if `userId` is an ACTIVE trainer of `studentId` (any of possibly many). */
export async function isActiveTrainerOf(
  userId: string,
  studentId: string,
): Promise<boolean> {
  if (userId === studentId) return false;
  const link = await prisma.trainerStudent.findFirst({
    where: { trainerId: userId, studentId, status: "ACTIVE" },
    select: { id: true },
  });
  return link !== null;
}

/** True if `userId` is an ACTIVE nutritionist of `studentId`. */
export async function isActiveNutritionistOf(
  userId: string,
  studentId: string,
): Promise<boolean> {
  if (userId === studentId) return false;
  const link = await prisma.nutritionistStudent.findFirst({
    where: { nutritionistId: userId, studentId, status: "ACTIVE" },
    select: { id: true },
  });
  return link !== null;
}

type AccessMode = "read" | "write";

/**
 * A student always owns their data. For TRAINING data, any of the student's
 * active trainers may READ; WRITE is limited to the trainer who owns the
 * plan (checked at the plan level) or the student on a solo plan.
 *
 * PRIVACY SCOPE (owner decision 2026-07-24): trainers see TRAINING only.
 * Health/personal data (exams, body measurements, progress photos) is NOT
 * exposed to trainers — use `assertHealthDataAccess` for those, which grants
 * the owner only.
 */
export async function assertPlanAccess(
  userId: string,
  planId: string,
  mode: AccessMode,
): Promise<{ studentId: string; trainerId: string | null }> {
  const plan = await prisma.workoutPlan.findUnique({
    where: { id: planId },
    select: { studentId: true, trainerId: true },
  });
  if (!plan) throw new AuthzError("Plano não encontrado");

  if (mode === "write") {
    // Owning trainer, or the student on a solo plan.
    if (plan.trainerId === userId) return plan;
    if (plan.trainerId === null && plan.studentId === userId) return plan;
    throw new AuthzError();
  }

  // read: owner, owning trainer, or any active trainer of the student.
  if (plan.studentId === userId) return plan;
  if (plan.trainerId === userId) return plan;
  if (await isActiveTrainerOf(userId, plan.studentId)) return plan;
  throw new AuthzError();
}

/** Guard a WorkoutSession by resolving it to its plan. */
export async function assertSessionAccess(
  userId: string,
  sessionId: string,
  mode: AccessMode,
): Promise<{ planId: string; studentId: string }> {
  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    select: { planId: true },
  });
  if (!session) throw new AuthzError("Sessão não encontrada");
  const plan = await assertPlanAccess(userId, session.planId, mode);
  return { planId: session.planId, studentId: plan.studentId };
}

/** Guard a SessionExercise by resolving session -> plan. */
export async function assertSessionExerciseAccess(
  userId: string,
  sessionExerciseId: string,
  mode: AccessMode,
): Promise<void> {
  const row = await prisma.sessionExercise.findUnique({
    where: { id: sessionExerciseId },
    select: { sessionId: true },
  });
  if (!row) throw new AuthzError("Exercício da sessão não encontrado");
  await assertSessionAccess(userId, row.sessionId, mode);
}

/**
 * Guard a WorkoutLog. WRITE: only the student who owns it. READ: the student,
 * or (training data) any active trainer of the student.
 */
export async function assertWorkoutLogAccess(
  userId: string,
  workoutLogId: string,
  mode: AccessMode,
): Promise<{ studentId: string }> {
  const log = await prisma.workoutLog.findUnique({
    where: { id: workoutLogId },
    select: { studentId: true },
  });
  if (!log) throw new AuthzError("Registro de treino não encontrado");
  if (log.studentId === userId) return log;
  if (mode === "read" && (await isActiveTrainerOf(userId, log.studentId)))
    return log;
  throw new AuthzError();
}

/**
 * Health & personal data (exams, body metrics, progress photos). Owner ONLY.
 * Trainers deliberately excluded per the owner's privacy decision.
 */
export async function assertHealthDataOwner(
  userId: string,
  studentId: string,
): Promise<void> {
  if (userId !== studentId) throw new AuthzError();
}
