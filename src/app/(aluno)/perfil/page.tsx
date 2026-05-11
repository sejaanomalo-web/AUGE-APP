import { LogOut, UserCircle } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProfileEditor } from "@/components/shared/ProfileEditor";
import { LinkTrainerDialog } from "@/components/aluno/LinkTrainerDialog";
import { requireRole } from "@/lib/auth-helpers";
import { getMyTrainer } from "@/lib/actions/users";

export default async function PerfilAlunoPage() {
  const user = await requireRole("ALUNO");
  const trainer = await getMyTrainer();

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
        <h2 className="text-h3 text-text-primary mb-3">Personal vinculado</h2>
        {trainer ? (
          <Card variant="default" className="flex items-center gap-4">
            <Avatar
              src={trainer.avatarUrl ?? undefined}
              name={trainer.name}
              size={48}
            />
            <div className="flex-1 min-w-0">
              <p className="text-body-lg font-semibold text-text-primary truncate">
                {trainer.name}
              </p>
              <p className="text-caption text-text-muted truncate">
                {trainer.email}
              </p>
            </div>
            <Badge variant="concluido">Ativo</Badge>
          </Card>
        ) : (
          <Card variant="default" className="flex items-center gap-3">
            <UserCircle size={32} className="text-text-muted" aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="text-body text-text-primary">
                Sem personal vinculado
              </p>
              <p className="text-caption text-text-muted">
                Cole um código de convite para vincular um personal.
              </p>
            </div>
            <LinkTrainerDialog />
          </Card>
        )}
      </section>

      <section>
        <h2 className="text-h3 text-text-primary mb-3">Conta</h2>
        <div className="flex flex-wrap gap-2">
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
