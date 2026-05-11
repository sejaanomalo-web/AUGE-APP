"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ALLOWED_MIMES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = 10 * 1024 * 1024;

export async function uploadExam(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null;
  const notes = (formData.get("notes") as string | null) || null;
  const dateStr = formData.get("date") as string | null;

  if (!file || !type) throw new Error("Arquivo e tipo obrigatórios");
  if (!ALLOWED_MIMES.includes(file.type))
    throw new Error("Tipo de arquivo não permitido (PDF, JPEG, PNG)");
  if (file.size > MAX_SIZE) throw new Error("Arquivo maior que 10MB");

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storageKey = `${userId}/${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await getSupabaseAdmin()
    .storage.from("exams")
    .upload(storageKey, buffer, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Upload falhou: ${error.message}`);

  await prisma.examUpload.create({
    data: {
      studentId: userId,
      type,
      storageKey,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      notes,
      date: dateStr ? new Date(dateStr) : new Date(),
    },
  });

  revalidatePath("/medidas");
}

export async function getExamSignedUrl(examId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const exam = await prisma.examUpload.findUnique({
    where: { id: examId },
    include: { student: { include: { studentLinks: true } } },
  });
  if (!exam) throw new Error("Exame não encontrado");

  const isOwner = exam.studentId === userId;
  const isLinkedTrainer = exam.student.studentLinks.some(
    (l) => l.trainerId === userId && l.status === "ACTIVE",
  );
  if (!isOwner && !isLinkedTrainer) throw new Error("Sem permissão");

  const { data, error } = await getSupabaseAdmin()
    .storage.from("exams")
    .createSignedUrl(exam.storageKey, 60 * 5);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function deleteExam(examId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const exam = await prisma.examUpload.findUnique({ where: { id: examId } });
  if (!exam || exam.studentId !== userId) throw new Error("Sem permissão");

  await getSupabaseAdmin().storage.from("exams").remove([exam.storageKey]);
  await prisma.examUpload.delete({ where: { id: examId } });
  revalidatePath("/medidas");
}

export async function listMyExams() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");
  return prisma.examUpload.findMany({
    where: { studentId: userId },
    orderBy: { date: "desc" },
  });
}
