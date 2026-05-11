import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export default async function PostLoginPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.role) redirect("/onboarding");
  if (user.role === "PERSONAL") redirect("/dashboard");
  if (user.role === "ALUNO") redirect("/hoje");

  redirect("/onboarding");
}
