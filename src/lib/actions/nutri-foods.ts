"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface FoodOption {
  id: string;
  name: string;
  brand: string | null;
  isCustom: boolean;
  source: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number | null;
}

/**
 * Lists all FoodCatalog rows, capped at `take`. For the /nutri/alimentos
 * library view: sort by source (TACO first, then custom) and name.
 */
export async function listFoods(take = 200): Promise<FoodOption[]> {
  return prisma.foodCatalog.findMany({
    orderBy: [{ source: "asc" }, { name: "asc" }],
    take,
  });
}

/**
 * Substring search with pg_trgm-friendly ordering. Falls back to a plain
 * ILIKE when query is too short for similarity to be meaningful.
 */
export async function searchFoods(query: string): Promise<FoodOption[]> {
  const q = query.trim();
  if (q.length === 0) return [];
  if (q.length < 2) {
    return prisma.foodCatalog.findMany({
      where: { name: { startsWith: q, mode: "insensitive" } },
      orderBy: { name: "asc" },
      take: 20,
    });
  }
  // Use $queryRaw to combine ILIKE substring + trigram similarity ordering.
  // The pg_trgm GIN index on name accelerates both.
  const rows = await prisma.$queryRaw<FoodOption[]>`
    SELECT id, name, brand, "isCustom", source,
           "kcalPer100g", "proteinPer100g", "carbsPer100g", "fatPer100g", "fiberPer100g"
    FROM "FoodCatalog"
    WHERE name ILIKE ${`%${q}%`}
    ORDER BY similarity(name, ${q}) DESC, name ASC
    LIMIT 20
  `;
  return rows;
}

export async function createCustomFood(input: {
  name: string;
  brand?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== "NUTRICIONISTA")
    throw new Error("Apenas nutricionistas podem criar alimentos custom");

  const food = await prisma.foodCatalog.create({
    data: {
      name: input.name.trim(),
      brand: input.brand?.trim() || null,
      isCustom: true,
      createdById: userId,
      source: "USER",
      kcalPer100g: input.kcalPer100g,
      proteinPer100g: input.proteinPer100g,
      carbsPer100g: input.carbsPer100g,
      fatPer100g: input.fatPer100g,
      fiberPer100g: input.fiberPer100g ?? null,
    },
  });

  revalidatePath("/nutri/alimentos");
  return food;
}

export async function deleteCustomFood(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const food = await prisma.foodCatalog.findUnique({ where: { id } });
  if (!food) throw new Error("Alimento não encontrado");
  if (!food.isCustom || food.createdById !== userId)
    throw new Error("Você só pode excluir alimentos que você criou");

  // Prevent delete if referenced - Prisma will throw P2003 on FK violation,
  // but we precheck to give a clearer error message.
  const inUse = await prisma.mealItem.count({ where: { foodId: id } });
  if (inUse > 0)
    throw new Error(
      `Este alimento está em ${inUse} item${inUse === 1 ? "" : "s"} de cardápio e não pode ser excluído.`,
    );

  await prisma.foodCatalog.delete({ where: { id } });
  revalidatePath("/nutri/alimentos");
}
