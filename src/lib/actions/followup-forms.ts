"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { customAlphabet } from "nanoid";
import { notifyUser } from "@/lib/notifications/notify";
import type { FollowUpQuestionType } from "@prisma/client";

// Token de envio é navegável por URL; 32 chars hex baixam colisão sem expor o id no DB.
const generateToken = customAlphabet("0123456789abcdef", 32);

// Validade padrão de envio antes do cron expirar (14d).
const SEND_TTL_MS = 1000 * 60 * 60 * 24 * 14;

async function requirePersonal() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== "PERSONAL")
    throw new Error("Apenas personais podem usar esta ação");
  return userId;
}

async function requireAluno() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== "ALUNO") throw new Error("Apenas alunos podem responder");
  return userId;
}

export interface TemplateQuestionInput {
  label: string;
  type: FollowUpQuestionType;
  required: boolean;
  order: number;
}

export async function createTemplate(params: {
  name: string;
  description?: string;
  questions: TemplateQuestionInput[];
}) {
  const trainerId = await requirePersonal();
  if (!params.name.trim()) throw new Error("Nome obrigatório");
  if (params.questions.length === 0)
    throw new Error("Adicione pelo menos uma pergunta");

  const template = await prisma.followUpFormTemplate.create({
    data: {
      trainerId,
      name: params.name.trim(),
      description: params.description?.trim() || null,
      questions: {
        create: params.questions.map((q, idx) => ({
          label: q.label.trim(),
          type: q.type,
          required: q.required,
          order: q.order ?? idx,
        })),
      },
    },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  revalidatePath("/formularios");
  return template;
}

export async function listMyTemplates() {
  const trainerId = await requirePersonal();
  return prisma.followUpFormTemplate.findMany({
    where: { trainerId, isArchived: false },
    include: { questions: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateTemplate(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    questions?: TemplateQuestionInput[];
  },
) {
  const trainerId = await requirePersonal();
  const existing = await prisma.followUpFormTemplate.findFirst({
    where: { id, trainerId },
  });
  if (!existing) throw new Error("Template não encontrado");

  await prisma.$transaction(async (tx) => {
    await tx.followUpFormTemplate.update({
      where: { id },
      data: {
        name: data.name?.trim() ?? existing.name,
        description:
          data.description === undefined
            ? existing.description
            : data.description?.trim() || null,
      },
    });

    // Re-cria perguntas quando vier lista nova (mantém consistência de ordem/labels sem diff manual).
    if (data.questions) {
      await tx.followUpFormQuestion.deleteMany({ where: { templateId: id } });
      await tx.followUpFormQuestion.createMany({
        data: data.questions.map((q, idx) => ({
          templateId: id,
          label: q.label.trim(),
          type: q.type,
          required: q.required,
          order: q.order ?? idx,
        })),
      });
    }
  });

  revalidatePath("/formularios");
  return prisma.followUpFormTemplate.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
}

export async function archiveTemplate(id: string) {
  const trainerId = await requirePersonal();
  await prisma.followUpFormTemplate.updateMany({
    where: { id, trainerId },
    data: { isArchived: true },
  });
  revalidatePath("/formularios");
}

export async function sendFormToStudent(params: {
  templateId: string;
  studentId: string;
}) {
  const trainerId = await requirePersonal();

  // Garante vínculo ativo trainer→aluno antes de criar envio.
  const link = await prisma.trainerStudent.findFirst({
    where: {
      trainerId,
      studentId: params.studentId,
      status: "ACTIVE",
    },
  });
  if (!link) throw new Error("Aluno não vinculado ou inativo");

  const template = await prisma.followUpFormTemplate.findFirst({
    where: { id: params.templateId, trainerId, isArchived: false },
  });
  if (!template) throw new Error("Template não encontrado");

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SEND_TTL_MS);

  const send = await prisma.followUpFormSend.create({
    data: {
      templateId: params.templateId,
      trainerId,
      studentId: params.studentId,
      token,
      expiresAt,
    },
  });

  notifyUser({
    userId: params.studentId,
    type: "FOLLOWUP_FORM_SENT",
    title: "Novo formulário do seu personal",
    body: template.name,
    data: { sendId: send.id, templateId: template.id },
    url: `/acompanhamento/${token}`,
  }).catch(() => null);

  revalidatePath(`/alunos/${params.studentId}`);
  return send;
}

export async function listSendsForStudent(studentId: string) {
  const trainerId = await requirePersonal();
  return prisma.followUpFormSend.findMany({
    where: { trainerId, studentId },
    include: {
      template: { include: { questions: { orderBy: { order: "asc" } } } },
      answers: true,
    },
    orderBy: { sentAt: "desc" },
  });
}

export async function getSendByToken(token: string) {
  const userId = await requireAluno();
  const send = await prisma.followUpFormSend.findUnique({
    where: { token },
    include: {
      template: { include: { questions: { orderBy: { order: "asc" } } } },
      answers: true,
      trainer: { select: { name: true, avatarUrl: true } },
    },
  });
  if (!send) throw new Error("Formulário não encontrado");
  if (send.studentId !== userId)
    throw new Error("Você não tem acesso a este formulário");
  return send;
}

export async function submitFormAnswers(params: {
  token: string;
  answers: {
    questionId: string;
    valueText?: string | null;
    valueNumber?: number | null;
    valueBool?: boolean | null;
  }[];
}) {
  const userId = await requireAluno();
  const send = await prisma.followUpFormSend.findUnique({
    where: { token: params.token },
    include: { template: { include: { questions: true } } },
  });
  if (!send) throw new Error("Formulário não encontrado");
  if (send.studentId !== userId) throw new Error("Sem acesso");
  if (send.status !== "PENDING")
    throw new Error("Formulário já respondido ou indisponível");
  if (send.expiresAt < new Date()) throw new Error("Formulário expirado");

  // Garante que toda pergunta obrigatória recebeu valor compatível com o tipo.
  const byId = new Map(send.template.questions.map((q) => [q.id, q]));
  for (const q of send.template.questions) {
    if (!q.required) continue;
    const a = params.answers.find((x) => x.questionId === q.id);
    if (!a) throw new Error(`Resposta faltando: ${q.label}`);
    if (q.type === "YES_NO" && a.valueBool === null) {
      throw new Error(`Selecione uma opção: ${q.label}`);
    }
    if (q.type === "NUMBER" && (a.valueNumber === null || a.valueNumber === undefined)) {
      throw new Error(`Informe um número: ${q.label}`);
    }
    if (
      (q.type === "TEXT" || q.type === "TEXTAREA") &&
      (!a.valueText || !a.valueText.trim())
    ) {
      throw new Error(`Preencha: ${q.label}`);
    }
    if (q.type === "RATING_1_5" && (a.valueNumber === null || a.valueNumber === undefined)) {
      throw new Error(`Dê uma nota: ${q.label}`);
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.followUpFormAnswer.createMany({
      data: params.answers
        .filter((a) => byId.has(a.questionId))
        .map((a) => ({
          sendId: send.id,
          questionId: a.questionId,
          valueText: a.valueText ?? null,
          valueNumber: a.valueNumber ?? null,
          valueBool: a.valueBool ?? null,
        })),
    });
    await tx.followUpFormSend.update({
      where: { id: send.id },
      data: { status: "ANSWERED", answeredAt: new Date() },
    });
  });

  notifyUser({
    userId: send.trainerId,
    type: "FOLLOWUP_FORM_ANSWERED",
    title: "Aluno respondeu formulário",
    body: send.template.name,
    data: { sendId: send.id, studentId: userId },
    url: `/alunos/${userId}`,
  }).catch(() => null);

  revalidatePath(`/acompanhamento/${params.token}`);
  return { ok: true as const };
}
