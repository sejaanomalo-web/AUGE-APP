import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ROLE_DEFAULT_ROUTE } from "@/lib/auth/role-routes";

export default async function PostLoginPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.role) redirect("/onboarding");

  redirect(ROLE_DEFAULT_ROUTE[user.role]);
}
