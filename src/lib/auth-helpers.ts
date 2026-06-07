import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "./prisma";
import { ensureUserRecord } from "./actions/users";
import { ROLE_DEFAULT_ROUTE } from "./auth/role-routes";

/**
 * Busca do usuário atual memoizada por request (React cache). Layout, página
 * e actions no mesmo render compartilham UMA única ida ao banco em vez de
 * refazer `user.findUnique` 2-3× por request.
 */
export const getCurrentUser = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;
  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) user = await ensureUserRecord();
  return user;
});

/**
 * Server-side helper: ensure user is authenticated, has a User row,
 * and has the expected role. Redirects otherwise.
 */
export async function requireRole(expected: UserRole) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.role) redirect("/onboarding");
  if (user.role !== expected) {
    redirect(ROLE_DEFAULT_ROUTE[user.role]);
  }
  return user;
}

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  return userId;
}

export function requireNutricionista() {
  return requireRole("NUTRICIONISTA");
}
