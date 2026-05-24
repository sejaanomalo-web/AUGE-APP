"use server";

import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyUser } from "@/lib/notifications/notify";

const EVALUATION_BUCKET = "avatars"; // reuses the existing public bucket
const ALLOWED_PHOTO_MIMES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_SIZE = 4 * 1024 * 1024; // 4 MB

export type EvaluationResult<T = void> =
  | (T extends void ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

export interface EvaluationListItem {
  id: string;
  dateIso: string;
  weight: number | null;
  bodyFat: number | null;
  measurements: Record<string, number> | null;
  notes: string | null;
  photoUrl: string | null;
}

/**
 * Maps the Prisma error code that surfaces when the `photoUrl` column
 * isn't on the table yet (migration not applied) so we can show a clean
 * message instead of a generic crash.
 */
function isPhotoColumnMissing(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    (err.code === "P2022" || err.code === "P2021")
  );
}

/** Legacy entry point — kept for /medidas/novo. No file support. */
export async function addMetric(data: {
  date: Date;
  weight?: number;
  bodyFat?: number;
  measurements?: Record<string, number>;
  notes?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const metric = await prisma.bodyMetric.create({
    data: { ...data, studentId: userId },
  });

  const link = await prisma.trainerStudent.findFirst({
    where: { studentId: userId, status: "ACTIVE" },
    include: { student: true },
  });
  if (link) {
    notifyUser({
      userId: link.trainerId,
      type: "STUDENT_METRIC_ADDED",
      title: "Nova medida registrada",
      body: `${link.student.name} adicionou uma nova medida`,
      data: { studentId: userId, metricId: metric.id },
      url: `/alunos/${userId}`,
    }).catch(() => null);
  }

  revalidatePath("/medidas");
  revalidatePath("/evolucao");
  return metric;
}

export async function getMyMetrics() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");
  return prisma.bodyMetric.findMany({
    where: { studentId: userId },
    orderBy: { date: "desc" },
  });
}

export async function deleteMetric(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");
  await prisma.bodyMetric.deleteMany({ where: { id, studentId: userId } });
  revalidatePath("/medidas");
}

/* ─────────────────────────────────────────────────────────────
 * New "evaluation" flow — used by /evolucao. Same BodyMetric table,
 * but the action accepts FormData so it can optionally carry a photo
 * upload alongside the numeric fields. Returns ActionResult so
 * production builds don't sanitise the error message.
 * ───────────────────────────────────────────────────────────── */

export interface ListEvaluationsResult {
  evaluations: EvaluationListItem[];
  /** True when the photoUrl column doesn't exist yet (migration pending). */
  schemaMissing?: boolean;
}

export async function listMyEvaluations(): Promise<ListEvaluationsResult> {
  const { userId } = await auth();
  if (!userId) return { evaluations: [] };

  try {
    const rows = await prisma.bodyMetric.findMany({
      where: { studentId: userId },
      orderBy: { date: "desc" },
      take: 50,
    });
    return {
      evaluations: rows.map((r) => ({
        id: r.id,
        dateIso: r.date.toISOString(),
        weight: r.weight,
        bodyFat: r.bodyFat,
        measurements: (r.measurements as Record<string, number> | null) ?? null,
        notes: r.notes,
        photoUrl: r.photoUrl,
      })),
    };
  } catch (err) {
    if (isPhotoColumnMissing(err)) {
      console.warn(
        "[listMyEvaluations] BodyMetric.photoUrl missing — apply migration 20260518_bodymetric_photo.",
      );
      return { evaluations: [], schemaMissing: true };
    }
    throw err;
  }
}

/**
 * Adds a physical evaluation. The form is sent as FormData so the
 * action can carry both numeric fields AND an optional File upload.
 *
 * FormData expected keys:
 *   date           — "YYYY-MM-DD" (required)
 *   weight         — number or "" (optional)
 *   bodyFat        — number or "" (optional)
 *   height,
 *   waist,
 *   arm,
 *   thigh,
 *   hip,
 *   chest          — measurements (optional, all in cm; height in cm too)
 *   notes          — free text (optional)
 *   photo          — File (optional, JPG/PNG/WebP, ≤ 4MB)
 */
export async function addEvaluation(
  formData: FormData,
): Promise<EvaluationResult<{ id: string }>> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Não autenticado." };

    const dateRaw = String(formData.get("date") ?? "");
    if (!dateRaw) return { ok: false, error: "Data é obrigatória." };
    const date = new Date(dateRaw);
    if (Number.isNaN(date.getTime())) {
      return { ok: false, error: "Data inválida." };
    }

    const numericField = (key: string, max: number, label: string) => {
      const raw = String(formData.get(key) ?? "").trim().replace(",", ".");
      if (!raw) return { ok: true as const, value: undefined };
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0 || n > max) {
        return {
          ok: false as const,
          error: `${label} fora do intervalo (0–${max}).`,
        };
      }
      return { ok: true as const, value: n };
    };

    const weight = numericField("weight", 500, "Peso");
    if (!weight.ok) return { ok: false, error: weight.error };
    const bodyFat = numericField("bodyFat", 100, "% de gordura");
    if (!bodyFat.ok) return { ok: false, error: bodyFat.error };

    const measurementKeys = ["height", "waist", "arm", "thigh", "hip", "chest"];
    const measurements: Record<string, number> = {};
    for (const k of measurementKeys) {
      const f = numericField(k, k === "height" ? 300 : 250, k);
      if (!f.ok) return { ok: false, error: f.error };
      if (f.value !== undefined) measurements[k] = f.value;
    }

    const notes = String(formData.get("notes") ?? "").trim() || undefined;

    // Refuse an entirely blank evaluation.
    const anyValue =
      weight.value !== undefined ||
      bodyFat.value !== undefined ||
      Object.keys(measurements).length > 0 ||
      notes !== undefined;
    const file = formData.get("photo");
    const hasFile = file instanceof File && file.size > 0;
    if (!anyValue && !hasFile) {
      return {
        ok: false,
        error: "Preencha pelo menos um campo ou anexe uma foto.",
      };
    }

    // Photo validation
    let photoUrl: string | null = null;
    if (hasFile) {
      const f = file as File;
      if (!ALLOWED_PHOTO_MIMES.includes(f.type)) {
        return {
          ok: false,
          error: "Formato de foto não permitido. Use JPG, PNG ou WebP.",
        };
      }
      if (f.size > MAX_PHOTO_SIZE) {
        return {
          ok: false,
          error: `Foto maior que ${MAX_PHOTO_SIZE / 1024 / 1024} MB.`,
        };
      }
    }

    // 1) Create the row first so we have an id to namespace the photo by.
    let metric;
    try {
      metric = await prisma.bodyMetric.create({
        data: {
          studentId: userId,
          date,
          weight: weight.value,
          bodyFat: bodyFat.value,
          measurements:
            Object.keys(measurements).length > 0 ? measurements : undefined,
          notes,
        },
        select: { id: true },
      });
    } catch (err) {
      console.error("[addEvaluation] create row failed", err);
      throw err;
    }

    // 2) Upload the photo (if present) and patch the row with the URL.
    if (hasFile) {
      try {
        const f = file as File;
        const ext = f.name.split(".").pop()?.toLowerCase() || "jpg";
        const key = `${userId}/evaluations/${metric.id}.${ext}`;
        const buffer = Buffer.from(await f.arrayBuffer());
        const supabase = getSupabaseAdmin();
        const { error: uploadError } = await supabase.storage
          .from(EVALUATION_BUCKET)
          .upload(key, buffer, { contentType: f.type, upsert: true });
        if (uploadError) {
          console.error(
            "[addEvaluation] photo upload failed",
            uploadError,
          );
          // Soft-fail: keep the evaluation, drop the photo, tell the user.
          return {
            ok: false,
            error: `Avaliação salva, mas a foto falhou: ${uploadError.message}`,
          };
        }
        const { data: pub } = supabase.storage
          .from(EVALUATION_BUCKET)
          .getPublicUrl(key);
        photoUrl = `${pub.publicUrl}?v=${Date.now()}`;
        try {
          await prisma.bodyMetric.update({
            where: { id: metric.id },
            data: { photoUrl },
          });
        } catch (err) {
          if (isPhotoColumnMissing(err)) {
            console.warn(
              "[addEvaluation] photoUrl column missing — evaluation saved without photo.",
            );
            // Keep the row, drop the photo URL silently.
          } else {
            throw err;
          }
        }
      } catch (err) {
        console.error("[addEvaluation] photo handling failed", err);
        // Keep the evaluation row.
      }
    }

    // Notify trainer if linked.
    try {
      const link = await prisma.trainerStudent.findFirst({
        where: { studentId: userId, status: "ACTIVE" },
        include: { student: true },
      });
      if (link) {
        notifyUser({
          userId: link.trainerId,
          type: "STUDENT_METRIC_ADDED",
          title: "Nova avaliação registrada",
          body: `${link.student.name} adicionou uma nova avaliação física.`,
          data: { studentId: userId, metricId: metric.id },
          url: `/alunos/${userId}`,
        }).catch(() => null);
      }
    } catch (e) {
      console.error("[addEvaluation] notify lookup failed", e);
    }

    revalidatePath("/evolucao");
    revalidatePath("/medidas");
    return { ok: true, data: { id: metric.id } };
  } catch (err) {
    console.error("[addEvaluation] failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao salvar avaliação.",
    };
  }
}

export async function deleteEvaluation(
  id: string,
): Promise<EvaluationResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Não autenticado." };

    const existing = await prisma.bodyMetric.findFirst({
      where: { id, studentId: userId },
      select: { id: true, photoUrl: true },
    });
    if (!existing) return { ok: false, error: "Avaliação não encontrada." };

    // Best-effort photo cleanup. Don't block the delete if storage hiccups.
    if (existing.photoUrl) {
      try {
        // Pull the key out of the public URL: …/<bucket>/<key>?v=…
        const match = existing.photoUrl.match(
          new RegExp(`/${EVALUATION_BUCKET}/([^?]+)`),
        );
        if (match) {
          const supabase = getSupabaseAdmin();
          await supabase.storage
            .from(EVALUATION_BUCKET)
            .remove([decodeURIComponent(match[1])]);
        }
      } catch (e) {
        console.warn("[deleteEvaluation] photo cleanup failed", e);
      }
    }

    await prisma.bodyMetric.delete({ where: { id } });
    revalidatePath("/evolucao");
    revalidatePath("/medidas");
    return { ok: true };
  } catch (err) {
    console.error("[deleteEvaluation] failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao remover avaliação.",
    };
  }
}
