import { PageHeader } from "@/components/shared/PageHeader";
import {
  FollowUpTemplatesManager,
  type TemplateView,
} from "@/components/personal/FollowUpTemplatesManager";
import { requireRole } from "@/lib/auth-helpers";
import { listMyTemplates } from "@/lib/actions/followup-forms";

export default async function FormulariosPage() {
  await requireRole("PERSONAL");
  const templates = await listMyTemplates();

  const view: TemplateView[] = templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    isArchived: t.isArchived,
    questions: t.questions.map((q) => ({
      id: q.id,
      label: q.label,
      type: q.type,
      required: q.required,
      order: q.order,
    })),
  }));

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Formulários"
        subtitle="Templates de acompanhamento para enviar aos alunos"
      />
      <FollowUpTemplatesManager templates={view} />
    </div>
  );
}
