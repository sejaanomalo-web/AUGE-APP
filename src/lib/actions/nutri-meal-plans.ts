"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications/notify";

async function requireNutriOwning(planId: string, userId: string) {
  const plan = await prisma.mealPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error("Cardápio não encontrado");
  if (plan.nutritionistId !== userId)
    throw new Error("Você não pode editar este cardápio");
  return plan;
}

async function requireNutriLink(studentId: string, userId: string) {
  const link = await prisma.nutritionistStudent.findFirst({
    where: { nutritionistId: userId, studentId, status: "ACTIVE" },
  });
  if (!link)
    throw new Error("Você não tem vínculo ativo com este aluno.");
  return link;
}

export async function getMyMealPlans() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  return prisma.mealPlan.findMany({
    where: { nutritionistId: userId },
    orderBy: [{ isActive: "desc" }, { startDate: "desc" }],
    include: {
      student: { select: { id: true, name: true, avatarUrl: true } },
      meals: { select: { id: true } },
    },
  });
}

export async function getMealPlan(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const plan = await prisma.mealPlan.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, avatarUrl: true } },
      meals: {
        orderBy: { order: "asc" },
        include: {
          items: {
            orderBy: { order: "asc" },
            include: { food: true },
          },
        },
      },
    },
  });

  if (!plan) throw new Error("Cardápio não encontrado");
  // Visivel pelo nutricionista dono ou pelo próprio aluno
  if (plan.nutritionistId !== userId && plan.studentId !== userId)
    throw new Error("Sem permissão pra ver este cardápio");

  return plan;
}

export interface CreateMealPlanInput {
  studentId: string;
  name: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  targetCalories?: number;
  targetProteinG?: number;
  targetCarbsG?: number;
  targetFatG?: number;
  meals: Array<{
    name: string;
    timeOfDay?: string;
    notes?: string;
    items: Array<{
      foodId: string;
      quantity: number;
      unit: string;
      notes?: string;
    }>;
  }>;
}

export async function createMealPlan(input: CreateMealPlanInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (me?.role !== "NUTRICIONISTA")
    throw new Error("Apenas nutricionistas podem criar cardápios");

  await requireNutriLink(input.studentId, userId);

  if (!input.name.trim()) throw new Error("Nome obrigatório");
  if (input.meals.length === 0)
    throw new Error("O cardápio precisa ter ao menos uma refeição");

  const plan = await prisma.mealPlan.create({
    data: {
      nutritionistId: userId,
      studentId: input.studentId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      targetCalories: input.targetCalories ?? null,
      targetProteinG: input.targetProteinG ?? null,
      targetCarbsG: input.targetCarbsG ?? null,
      targetFatG: input.targetFatG ?? null,
      meals: {
        create: input.meals.map((meal, mealIdx) => ({
          name: meal.name.trim(),
          timeOfDay: meal.timeOfDay?.trim() || null,
          notes: meal.notes?.trim() || null,
          order: mealIdx,
          items: {
            create: meal.items.map((item, itemIdx) => ({
              foodId: item.foodId,
              quantity: item.quantity,
              unit: item.unit,
              notes: item.notes?.trim() || null,
              order: itemIdx,
            })),
          },
        })),
      },
    },
  });

  notifyUser({
    userId: input.studentId,
    type: "MEAL_PLAN_CREATED",
    vertical: "NUTRICAO",
    title: "Novo cardápio disponível",
    body: `${plan.name} foi prescrito pra você.`,
    data: { planId: plan.id },
    url: `/nutricao/cardapio/${plan.id}`,
  }).catch(() => null);

  revalidatePath("/nutri/cardapios");
  return { id: plan.id };
}

export async function deleteMealPlan(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  await requireNutriOwning(id, userId);
  await prisma.mealPlan.delete({ where: { id } });

  revalidatePath("/nutri/cardapios");
}

export async function setMealPlanStatus(
  id: string,
  status: "ACTIVE" | "PAUSED" | "INACTIVE",
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  await requireNutriOwning(id, userId);

  await prisma.mealPlan.update({
    where: { id },
    data: {
      isActive: status === "ACTIVE",
      pausedAt: status === "PAUSED" ? new Date() : null,
    },
  });

  revalidatePath("/nutri/cardapios");
  revalidatePath(`/nutri/cardapios/${id}`);
}

export async function getAlunosWithLink() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");
  const links = await prisma.nutritionistStudent.findMany({
    where: { nutritionistId: userId, status: "ACTIVE" },
    include: { student: { select: { id: true, name: true } } },
    orderBy: { startedAt: "desc" },
  });
  return links.map((l) => ({ id: l.student.id, name: l.student.name }));
}
