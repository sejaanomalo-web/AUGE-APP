"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const EXERCISE_BUCKET = "exercise-media";
const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export async function getExercises(filter?: {
  search?: string;
  muscleGroup?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  return prisma.exercise.findMany({
    where: {
      AND: [
        { OR: [{ isCustom: false }, { createdById: userId }] },
        filter?.muscleGroup ? { muscleGroup: filter.muscleGroup } : {},
        filter?.search
          ? { name: { contains: filter.search, mode: "insensitive" } }
          : {},
      ],
    },
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
  });
}

export async function createCustomExercise(data: {
  name: string;
  muscleGroup: string;
  instructions?: string;
  videoUrl?: string;
  imageUrl?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== "PERSONAL") throw new Error("Apenas personais");

  const ex = await prisma.exercise.create({
    data: { ...data, isCustom: true, createdById: userId },
  });

  revalidatePath("/exercicios");
  return ex;
}

export async function updateExercise(
  id: string,
  data: Partial<{
    name: string;
    muscleGroup: string;
    instructions: string;
    videoUrl: string;
    imageUrl: string;
  }>,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  await prisma.exercise.updateMany({
    where: { id, createdById: userId, isCustom: true },
    data,
  });
  revalidatePath("/exercicios");
}

/**
 * Upload an exercise image to the public `exercise-media` bucket and return
 * its public URL. Personal-only.
 */
export async function uploadExerciseImage(formData: FormData): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== "PERSONAL") throw new Error("Apenas personais");

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Arquivo obrigatório");
  if (!ALLOWED_IMAGE_MIMES.includes(file.type))
    throw new Error("Formato não permitido (use JPG, PNG ou WebP)");
  if (file.size > MAX_IMAGE_SIZE) throw new Error("Imagem maior que 5MB");

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const key = `${userId}/${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(EXERCISE_BUCKET)
    .upload(key, buffer, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Upload falhou: ${error.message}`);

  const { data: pub } = supabase.storage.from(EXERCISE_BUCKET).getPublicUrl(key);
  return pub.publicUrl;
}

export async function getExerciseById(id: string) {
  return prisma.exercise.findUnique({ where: { id } });
}

export async function deleteExercise(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const inUse = await prisma.sessionExercise.findFirst({ where: { exerciseId: id } });
  if (inUse) throw new Error("Exercício está em uso em algum treino");

  await prisma.exercise.deleteMany({
    where: { id, createdById: userId, isCustom: true },
  });
  revalidatePath("/exercicios");
}
