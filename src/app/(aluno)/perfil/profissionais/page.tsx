import Link from "next/link";
import { ChevronLeft, Users } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth-helpers";
import { listMyProfessionalLinks } from "@/lib/actions/professional-context";
import { ProfissionaisAddDialog } from "@/components/aluno/ProfissionaisAddDialog";

export default async function PerfilProfissionaisPage() {
  await requireRole("ALUNO");
  const { trainerLinks, nutritionistLinks } = await listMyProfessionalLinks();

  const activeTrainers = trainerLinks.filter((l) => l.status !== "ENDED");
  const endedTrainers = trainerLinks.filter((l) => l.status === "ENDED");
  const activeNutris = nutritionistLinks.filter((l) => l.status !== "ENDED");
  const endedNutris = nutritionistLinks.filter((l) => l.status === "ENDED");

  const noActive = activeTrainers.length === 0 && activeNutris.length === 0;

  return (
    <div className="max-w-3xl mx-auto">
      <header className="flex items-center gap-3 mb-4">
        <Link href="/perfil">
          <IconButton aria-label="Voltar">
            <ChevronLeft size={20} />
          </IconButton>
        </Link>
      </header>
      <PageHeader
        title="Profissionais"
        subtitle="Gerencie seus vínculos com personal e nutricionista"
        actions={<ProfissionaisAddDialog />}
      />

      {noActive && endedTrainers.length === 0 && endedNutris.length === 0 ? (
        <Card variant="default">
          <EmptyState
            icon={Users}
            title="Nenhum profissional vinculado"
            description="Adicione um profissional usando o código de convite que ele te passou."
            action={<ProfissionaisAddDialog />}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <Section title="Treinos">
            {activeTrainers.length === 0 ? (
              <EmptyMini text="Nenhum personal vinculado." />
            ) : (
              activeTrainers.map((l) => (
                <ProfessionalCard
                  key={l.id}
                  name={l.trainer.name}
                  avatarUrl={l.trainer.avatarUrl}
                  status={l.status}
                  startedAt={l.startedAt}
                />
              ))
            )}
          </Section>

          <Section title="Nutrição">
            {activeNutris.length === 0 ? (
              <EmptyMini text="Nenhuma nutricionista vinculada." />
            ) : (
              activeNutris.map((l) => (
                <ProfessionalCard
                  key={l.id}
                  name={l.nutritionist.name}
                  avatarUrl={l.nutritionist.avatarUrl}
                  status={l.status}
                  startedAt={l.startedAt}
                />
              ))
            )}
          </Section>

          {(endedTrainers.length > 0 || endedNutris.length > 0) && (
            <Section title="Anteriores">
              {endedTrainers.map((l) => (
                <ProfessionalCard
                  key={l.id}
                  name={l.trainer.name}
                  avatarUrl={l.trainer.avatarUrl}
                  status={l.status}
                  startedAt={l.startedAt}
                  endedAt={l.endedAt}
                  dim
                />
              ))}
              {endedNutris.map((l) => (
                <ProfessionalCard
                  key={l.id}
                  name={l.nutritionist.name}
                  avatarUrl={l.nutritionist.avatarUrl}
                  status={l.status}
                  startedAt={l.startedAt}
                  endedAt={l.endedAt}
                  dim
                />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-h2 text-text-primary mb-2">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <p className="text-caption text-text-muted bg-bg-elevated rounded-md p-3">
      {text}
    </p>
  );
}

function ProfessionalCard({
  name,
  avatarUrl,
  status,
  startedAt,
  endedAt,
  dim,
}: {
  name: string;
  avatarUrl: string | null;
  status: string;
  startedAt: Date;
  endedAt?: Date | null;
  dim?: boolean;
}) {
  return (
    <Card
      variant="default"
      className={dim ? "opacity-70" : undefined}
    >
      <div className="flex items-center gap-3">
        <Avatar src={avatarUrl ?? undefined} name={name} size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-body-lg font-semibold text-text-primary truncate">
            {name}
          </p>
          <p className="text-caption text-text-muted">
            {status === "ACTIVE" && `Vinculado desde ${formatDate(startedAt)}`}
            {status === "PAUSED" && `Pausado · iniciado em ${formatDate(startedAt)}`}
            {status === "PENDING" && `Aguardando aceite`}
            {status === "ENDED" &&
              endedAt &&
              `Encerrado em ${formatDate(endedAt)}`}
          </p>
        </div>
        <Badge
          variant={
            status === "ACTIVE"
              ? "concluido"
              : status === "PAUSED"
                ? "warning"
                : status === "PENDING"
                  ? "info"
                  : "pulado"
          }
        >
          {status === "ACTIVE"
            ? "ativo"
            : status === "PAUSED"
              ? "pausado"
              : status === "PENDING"
                ? "pendente"
                : "encerrado"}
        </Badge>
      </div>
    </Card>
  );
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
