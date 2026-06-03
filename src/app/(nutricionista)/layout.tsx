import { requireRole } from "@/lib/auth-helpers";
import { NutricionistaShell } from "@/components/nutri/NutricionistaShell";

export default async function NutricionistaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("NUTRICIONISTA");
  return (
    <div data-vertical="nutricao" className="min-h-screen bg-bg-base">
      <NutricionistaShell>{children}</NutricionistaShell>
    </div>
  );
}
