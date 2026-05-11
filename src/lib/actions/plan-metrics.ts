"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const METRICS_BUCKET = "plan-metrics";
const ALLOWED_ATTACHMENT_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

async function assertPlanOwner(userId: string, planId: string) {
  const plan = await prisma.workoutPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error("Plano não encontrado");
  const ok =
    plan.trainerId === userId ||
    (plan.trainerId === null && plan.studentId === userId);
  if (!ok) throw new Error("Sem permissão");
  return plan;
}

export async function createPlanMetric(data: {
  planId: string;
  name: string;
  unit?: string;
  requiresAttachment?: boolean;
  order?: number;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");
  await assertPlanOwner(userId, data.planId);

  const metric = await prisma.planMetricDefinition.create({
    data: {
      planId: data.planId,
      name: data.name.trim(),
      unit: data.unit?.trim() || null,
      requiresAttachment: data.requiresAttachment ?? false,
      order: data.order ?? 0,
    },
  });

  revalidatePath(`/treinos/${data.planId}`);
  revalidatePath(`/planos/${data.planId}`);
  return metric;
}

export async function updatePlanMetric(
  id: string,
  data: Partial<{
    name: string;
    unit: string | null;
    requiresAttachment: boolean;
    order: number;
  }>,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const metric = await prisma.planMetricDefinition.findUnique({
    where: { id },
  });
  if (!metric) throw new Error("Métrica não encontrada");
  await assertPlanOwner(userId, metric.planId);

  await prisma.planMetricDefinition.update({
    where: { id },
    data,
  });
  revalidatePath(`/treinos/${metric.planId}`);
  revalidatePath(`/planos/${metric.planId}`);
}

export async function deletePlanMetric(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const metric = await prisma.planMetricDefinition.findUnique({
    where: { id },
  });
  if (!metric) throw new Error("Métrica não encontrada");
  await assertPlanOwner(userId, metric.planId);

  await prisma.planMetricDefinition.delete({ where: { id } });
  revalidatePath(`/treinos/${metric.planId}`);
  revalidatePath(`/planos/${metric.planId}`);
}

export async function getPlanMetrics(planId: string) {
  return prisma.planMetricDefinition.findMany({
    where: { planId },
    orderBy: { order: "asc" },
  });
}

/**
 * Aluno logs a value for a custom plan metric. Optional attachment via FormData.
 * The action handles both pure-value submissions and form-data with attachment.
 */
export async function logPlanMetric(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const definitionId = formData.get("definitionId") as string;
  const value = (formData.get("value") as string)?.trim();
  if (!definitionId || !value) throw new Error("Campo obrigatório");

  const def = await prisma.planMetricDefinition.findUnique({
    where: { id: definitionId },
    include: { plan: true },
  });
  if (!def) throw new Error("Métrica não encontrada");

  // Only the plan's student can log this metric
  if (def.plan.studentId !== userId)
    throw new Error("Sem permissão para preencher esta métrica");

  const file = formData.get("file") as File | null;
  let attachmentKey: string | null = null;

  if (def.requiresAttachment && (!file || file.size === 0)) {
    throw new Error("Anexo obrigatório para essa métrica");
  }

  if (file && file.size > 0) {
    if (!ALLOWED_ATTACHMENT_MIMES.includes(file.type))
      throw new Error("Formato não permitido (PDF, JPG, PNG ou WebP)");
    if (file.size > MAX_ATTACHMENT_SIZE)
      throw new Error("Anexo maior que 10MB");

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const key = `${userId}/${def.planId}/${definitionId}/${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage
      .from(METRICS_BUCKET)
      .upload(key, buffer, { contentType: file.type, upsert: false });
    if (error) throw new Error(`Upload do anexo falhou: ${error.message}`);
    attachmentKey = key;
  }

  await prisma.planMetricLog.create({
    data: {
      definitionId,
      studentId: userId,
      value,
      attachmentKey,
    },
  });

  revalidatePath(`/planos/${def.planId}`);
}

export async function getPlanMetricLogs(planId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  return prisma.planMetricLog.findMany({
    where: {
      studentId: userId,
      definition: { planId },
    },
    include: { definition: true },
    orderBy: { date: "desc" },
  });
}

export async function getMetricAttachmentSignedUrl(logId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const log = await prisma.planMetricLog.findUnique({
    where: { id: logId },
    include: { definition: { include: { plan: true } } },
  });
  if (!log || !log.attachmentKey) throw new Error("Anexo não encontrado");

  // Allow: aluno owner OR trainer of the plan
  const isOwner = log.studentId === userId;
  const isTrainer = log.definition.plan.trainerId === userId;
  if (!isOwner && !isTrainer) throw new Error("Sem permissão");

  const { data, error } = await getSupabaseAdmin()
    .storage.from(METRICS_BUCKET)
    .createSignedUrl(log.attachmentKey, 60 * 5);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
