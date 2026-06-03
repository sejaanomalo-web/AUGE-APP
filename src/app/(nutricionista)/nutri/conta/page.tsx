import { User as UserIcon } from "lucide-react";
import { requireNutricionista } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";

export default async function NutriContaPage() {
  const me = await requireNutricionista();
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Perfil" subtitle="Sua conta de nutricionista" />
      <Card variant="default" className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-bg-elevated text-accent"
            aria-hidden
          >
            <UserIcon size={18} />
          </span>
          <div className="min-w-0">
            <CardTitle>{me.name}</CardTitle>
            <CardDescription>{me.email}</CardDescription>
          </div>
        </div>
        {me.crn && (
          <p className="mt-3 text-caption text-text-muted">CRN: {me.crn}</p>
        )}
      </Card>
    </div>
  );
}
