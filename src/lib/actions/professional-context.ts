import "server-only";
import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type VerticalKey = "treinos" | "nutricao";

interface ProfessionalInfo {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface ProfessionalsContext {
  trainer: ProfessionalInfo | null;
  nutritionist: ProfessionalInfo | null;
  available: VerticalKey[];
}

/**
 * Server-side helper used by the (aluno) layout (and any page that needs
 * the same data) to know which professional verticals the current user
 * has access to. Memoized per-render via React `cache()` so sub-routes
 * inside the same render tree reuse the single round-trip.
 */
export const getMyProfessionals = cache(
  async (): Promise<ProfessionalsContext> => {
    const { userId } = await auth();
    if (!userId) return { trainer: null, nutritionist: null, available: [] };

    const [trainerLink, nutriLink] = await Promise.all([
      prisma.trainerStudent.findFirst({
        where: { studentId: userId, status: "ACTIVE" },
        select: {
          trainer: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
      prisma.nutritionistStudent.findFirst({
        where: { studentId: userId, status: "ACTIVE" },
        select: {
          nutritionist: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
    ]);

    const available: VerticalKey[] = [];
    if (trainerLink) available.push("treinos");
    if (nutriLink) available.push("nutricao");

    return {
      trainer: trainerLink?.trainer ?? null,
      nutritionist: nutriLink?.nutritionist ?? null,
      available,
    };
  },
);

/**
 * Lists all ENDED + ACTIVE + PAUSED links for the current user, for the
 * /perfil/profissionais management page.
 */
export async function listMyProfessionalLinks() {
  const { userId } = await auth();
  if (!userId) return { trainerLinks: [], nutritionistLinks: [] };

  const [trainerLinks, nutritionistLinks] = await Promise.all([
    prisma.trainerStudent.findMany({
      where: { studentId: userId },
      orderBy: [{ status: "asc" }, { startedAt: "desc" }],
      include: {
        trainer: { select: { id: true, name: true, avatarUrl: true } },
      },
    }),
    prisma.nutritionistStudent.findMany({
      where: { studentId: userId },
      orderBy: [{ status: "asc" }, { startedAt: "desc" }],
      include: {
        nutritionist: { select: { id: true, name: true, avatarUrl: true } },
      },
    }),
  ]);

  return { trainerLinks, nutritionistLinks };
}
