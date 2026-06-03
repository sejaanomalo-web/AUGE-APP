import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "./prisma";
import { ensureUserRecord } from "./actions/users";
import { ROLE_DEFAULT_ROUTE } from "./auth/role-routes";

/**
 * Server-side helper: ensure user is authenticated, has a User row,
 * and has the expected role. Redirects otherwise.
 */
export async function requireRole(expected: UserRole) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    user = await ensureUserRecord();
  }
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
