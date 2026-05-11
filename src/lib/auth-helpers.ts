import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { ensureUserRecord } from "./actions/users";

/**
 * Server-side helper: ensure user is authenticated, has a User row,
 * and has the expected role. Redirects otherwise.
 */
export async function requireRole(expected: "PERSONAL" | "ALUNO") {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    user = await ensureUserRecord();
  }
  if (!user) redirect("/login");
  if (!user.role) redirect("/onboarding");
  if (user.role !== expected) {
    redirect(user.role === "PERSONAL" ? "/dashboard" : "/hoje");
  }
  return user;
}

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  return userId;
}
