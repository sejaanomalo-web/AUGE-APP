import { Bell, LogOut, Plug, UserCircle } from "lucide-react";
import { LinkButton } from "@/components/ui/LinkButton";
import { SignOutButton } from "@clerk/nextjs";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProfileEditor } from "@/components/shared/ProfileEditor";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { PasskeySettings } from "@/components/shared/PasskeySettings";
import { LinkTrainerDialog } from "@/components/aluno/LinkTrainerDialog";
import { StartTourButton } from "@/components/shared/StartTourButton";
import { requireRole } from "@/lib/auth-helpers";
import { getMyProfessionals } from "@/lib/actions/professional-context";
import { listMyPasskeys } from "@/lib/actions/passkeys";

export default async function PerfilAlunoPage() {
  const user = await requireRole("ALUNO");
  const [{ trainers, nutritionist }, passkeys] = await Promise.all([
    getMyProfessionals(),
    listMyPasskeys(),
  ]);

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Perfil" subtitle="Suas informações e configurações" />

      <ProfileEditor
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          phone: user.phone,
          birthDate: user.birthDate
            ? user.birthDate.toISOString().slice(0, 10)
            : null,
          height: user.height,
          currentWeight: user.currentWeight,
          goal: user.goal,
          cref: user.cref,
          sportsPracticed:
            ((user.sportsPracticed as string[] | null) ?? []),
          role: "ALUNO",
        }}
      />

      <section className="mt-8 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-h3 text-text-primary">Profissionais</h2>
          <LinkButton href="/perfil/profissionais" variant="secondary" size="md">
            Gerenciar
          </LinkButton>
        </div>
        <div className="flex flex-col gap-3">
          {/* MULTI-PERSONAL: a student can link several personals (e.g. one
              for the gym, one for running). Render one slot per active
              trainer, plus an always-present slot to link another. */}
          {trainers.map((t) => (
            <ProfessionalSlot
              key={t.id}
              label="Personal"
              professional={t}
              emptyText=""
            />
          ))}
          <ProfessionalSlot
            label="Personal"
            professional={null}
            emptyText={
              trainers.length > 0
                ? "Vincule outro personal (ex.: um para academia, outro para corrida)."
                : "Cole um código de convite para vincular um personal."
            }
          />
          <ProfessionalSlot
            label="Nutricionista"
            professional={nutritionist}
            emptyText="Cole um código de convite para vincular uma nutricionista."
          />
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-h3 text-text-primary mb-3">Ajuda</h2>
        <StartTourButton role="aluno" />
      </section>

      <section className="mb-6">
        <h2 className="text-h3 text-text-primary mb-3">Aparência</h2>
        <ThemeToggle />
      </section>

      <section className="mb-6">
        <h2 className="text-h3 text-text-primary mb-3">Segurança</h2>
        <PasskeySettings initialPasskeys={passkeys} />
      </section>

      <section className="mb-6">
        <h2 className="text-h3 text-text-primary mb-3">Integrações</h2>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/perfil/integracoes" variant="secondary" size="md">
            <Plug size={16} aria-hidden /> Integrações
          </LinkButton>
        </div>
      </section>

      <section>
        <h2 className="text-h3 text-text-primary mb-3">Conta</h2>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/perfil/notificacoes" variant="secondary" size="md">
            <Bell size={16} aria-hidden /> Notificações
          </LinkButton>
          <SignOutButton redirectUrl="/">
            <Button variant="destructive" size="md">
              <LogOut size={16} aria-hidden /> Sair
            </Button>
          </SignOutButton>
        </div>
      </section>
    </div>
  );
}

function ProfessionalSlot({
  label,
  professional,
  emptyText,
}: {
  label: string;
  professional: { id: string; name: string; avatarUrl: string | null } | null;
  emptyText: string;
}) {
  if (professional) {
    return (
      <Card variant="default" className="flex items-center gap-4">
        <Avatar
          src={professional.avatarUrl ?? undefined}
          name={professional.name}
          size={48}
        />
        <div className="flex-1 min-w-0">
          <p className="text-caption text-text-muted">{label}</p>
          <p className="text-body-lg font-semibold text-text-primary truncate">
            {professional.name}
          </p>
        </div>
        <Badge variant="concluido">Ativo</Badge>
      </Card>
    );
  }

  return (
    <Card variant="default" className="flex items-center gap-3">
      <UserCircle size={32} className="text-text-muted" aria-hidden />
      <div className="flex-1 min-w-0">
        <p className="text-body text-text-primary">Sem {label.toLowerCase()} vinculado</p>
        <p className="text-caption text-text-muted">{emptyText}</p>
      </div>
      <LinkTrainerDialog />
    </Card>
  );
}
