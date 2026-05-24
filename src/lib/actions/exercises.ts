"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const EXERCISE_BUCKET = "exercise-media";
const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export type ExerciseActionResult<T = void> =
  | (T extends void ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

/**
 * Resolve the requesting user and verify they are a PERSONAL. Pages
 * already gate this, but server actions can be invoked directly so the
 * check belongs here too.
 */
async function requirePersonal(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Não autenticado." };

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (me?.role !== "PERSONAL") {
    return {
      ok: false,
      error: "Apenas profissionais podem gerenciar exercícios.",
    };
  }
  return { ok: true, userId };
}

/**
 * Best-effort cleanup of an exercise image in Supabase storage. Called
 * when an image is replaced or its exercise is deleted, so the bucket
 * doesn't grow indefinitely with orphans. Never throws.
 */
async function removeExerciseImageObject(imageUrl: string): Promise<void> {
  try {
    // Public URL format:
    //   https://<project>.supabase.co/storage/v1/object/public/exercise-media/<key>
    const match = imageUrl.match(
      new RegExp(`/${EXERCISE_BUCKET}/([^?]+)`),
    );
    if (!match) return;
    const key = decodeURIComponent(match[1]);
    const supabase = getSupabaseAdmin();
    await supabase.storage.from(EXERCISE_BUCKET).remove([key]);
  } catch (err) {
    console.warn("[removeExerciseImageObject] cleanup failed", err);
  }
}

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
}): Promise<ExerciseActionResult<{ id: string }>> {
  try {
    const gate = await requirePersonal();
    if (!gate.ok) return gate;

    const name = data.name?.trim();
    if (!name) return { ok: false, error: "Nome é obrigatório." };

    const ex = await prisma.exercise.create({
      data: {
        ...data,
        name,
        isCustom: true,
        createdById: gate.userId,
      },
      select: { id: true },
    });
    revalidatePath("/exercicios");
    return { ok: true, data: { id: ex.id } };
  } catch (err) {
    console.error("[createCustomExercise] failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao criar exercício.",
    };
  }
}

/**
 * Update any exercise the personal can see (system seeds OR their own
 * customs). The page is PERSONAL-gated and the helper above re-verifies
 * the role server-side. When `imageUrl` is changed the old object is
 * deleted from storage as a best-effort, so editing a photo doesn't
 * leave orphans behind.
 */
export async function updateExercise(
  id: string,
  data: Partial<{
    name: string;
    muscleGroup: string;
    instructions: string;
    videoUrl: string;
    imageUrl: string;
  }>,
): Promise<ExerciseActionResult> {
  try {
    const gate = await requirePersonal();
    if (!gate.ok) return gate;

    if (data.name !== undefined && !data.name.trim()) {
      return { ok: false, error: "Nome é obrigatório." };
    }

    // Capture the current image so we can clean it up if it's being
    // replaced with a different one (or cleared).
    let previousImage: string | null = null;
    if (data.imageUrl !== undefined) {
      const existing = await prisma.exercise.findUnique({
        where: { id },
        select: { imageUrl: true },
      });
      if (!existing) {
        return { ok: false, error: "Exercício não encontrado." };
      }
      if (existing.imageUrl && existing.imageUrl !== data.imageUrl) {
        previousImage = existing.imageUrl;
      }
    }

    // updateMany with where:{id} so a missing row is a 0-count instead
    // of a thrown P2025 — easier to translate into a friendly message.
    const result = await prisma.exercise.updateMany({
      where: { id },
      data: {
        ...data,
        name: data.name?.trim(),
        // Empty string from the form means "remove" - normalise to null
        // so the DB stores NULL instead of "".
        instructions:
          data.instructions !== undefined
            ? data.instructions.trim() || null
            : undefined,
        videoUrl:
          data.videoUrl !== undefined
            ? data.videoUrl.trim() || null
            : undefined,
        imageUrl:
          data.imageUrl !== undefined ? data.imageUrl || null : undefined,
      },
    });
    if (result.count === 0) {
      return { ok: false, error: "Exercício não encontrado." };
    }

    if (previousImage) {
      await removeExerciseImageObject(previousImage);
    }

    revalidatePath("/exercicios");
    return { ok: true };
  } catch (err) {
    console.error("[updateExercise] failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao salvar exercício.",
    };
  }
}

/**
 * Upload an exercise image to the public `exercise-media` bucket and
 * return its public URL. Personal-only. Throws on failure so the form's
 * existing try/catch can surface the message inline.
 */
export async function uploadExerciseImage(formData: FormData): Promise<string> {
  const gate = await requirePersonal();
  if (!gate.ok) throw new Error(gate.error);

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Arquivo obrigatório");
  if (!ALLOWED_IMAGE_MIMES.includes(file.type))
    throw new Error("Formato não permitido (use JPG, PNG ou WebP)");
  if (file.size > MAX_IMAGE_SIZE) throw new Error("Imagem maior que 5MB");

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const key = `${gate.userId}/${Date.now()}-${safeName}`;
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

/**
 * Delete an exercise the personal can see. Blocks the delete (with a
 * clear, in-Portuguese error) if the exercise is referenced by any
 * existing WorkoutPlan session or historical ExerciseLog — those FKs
 * have no cascade rule, so deleting underneath them would corrupt
 * student plans and training history.
 */
export async function deleteExercise(id: string): Promise<ExerciseActionResult> {
  try {
    const gate = await requirePersonal();
    if (!gate.ok) return gate;

    const existing = await prisma.exercise.findUnique({
      where: { id },
      select: { imageUrl: true },
    });
    if (!existing) {
      return { ok: false, error: "Exercício não encontrado." };
    }

    const [usedInPlan, usedInLog] = await Promise.all([
      prisma.sessionExercise.count({ where: { exerciseId: id } }),
      prisma.exerciseLog.count({ where: { exerciseId: id } }),
    ]);
    if (usedInPlan > 0 || usedInLog > 0) {
      const refs: string[] = [];
      if (usedInPlan > 0) {
        refs.push(
          `${usedInPlan} ${usedInPlan === 1 ? "treino" : "treinos"}`,
        );
      }
      if (usedInLog > 0) {
        refs.push(
          `${usedInLog} ${
            usedInLog === 1 ? "registro de execução" : "registros de execução"
          }`,
        );
      }
      return {
        ok: false,
        error: `Não dá para excluir: está em uso em ${refs.join(
          " e ",
        )}. Remova das referências e tente de novo.`,
      };
    }

    await prisma.exercise.delete({ where: { id } });

    if (existing.imageUrl) {
      await removeExerciseImageObject(existing.imageUrl);
    }

    revalidatePath("/exercicios");
    return { ok: true };
  } catch (err) {
    console.error("[deleteExercise] failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao excluir exercício.",
    };
  }
}
