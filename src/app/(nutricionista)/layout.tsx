import { requireRole } from "@/lib/auth-helpers";

export default async function NutricionistaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("NUTRICIONISTA");
  return <div data-vertical="nutricao">{children}</div>;
}
