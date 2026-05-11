import { LogOut, Pencil, UserCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { requireRole } from "@/lib/auth-helpers";
import { getMyTrainer } from "@/lib/actions/users";
import { SignOutButton } from "@clerk/nextjs";

export default async function PerfilAlunoPage() {
  const user = await requireRole("ALUNO");
  const trainer = await getMyTrainer();

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Perfil" subtitle="Suas informações e configurações" />

      <Card variant="default" className="flex items-center gap-4 mb-6">
        <Avatar
          src={user.avatarUrl ?? undefined}
          name={user.name}
          size={64}
        />
        <div className="flex-1 min-w-0">
          <p className="text-h2 text-text-primary truncate">{user.name}</p>
          <p className="text-caption text-text-muted truncate">{user.email}</p>
          <div className="mt-2">
            <Badge>Aluno</Badge>
          </div>
        </div>
      </Card>

      <section className="mb-6">
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
          </Card>
        ) : (
          <Card variant="default" className="flex items-center gap-3">
            <UserCircle size={32} className="text-text-muted" aria-hidden />
            <div>
              <p className="text-body text-text-primary">
                Sem personal vinculado
              </p>
              <p className="text-caption text-text-muted">
                Peça um código de convite para se vincular a um personal.
              </p>
            </div>
          </Card>
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-h3 text-text-primary mb-3">Dados pessoais</h2>
        <Card variant="default">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Data de nascimento" htmlFor="birth">
              <Input
                id="birth"
                type="date"
                defaultValue={
                  user.birthDate
                    ? user.birthDate.toISOString().slice(0, 10)
                    : ""
                }
                readOnly
              />
            </Field>
            <Field label="Telefone" htmlFor="phone">
              <Input id="phone" defaultValue={user.phone ?? ""} readOnly />
            </Field>
            <Field label="Altura (cm)" htmlFor="height">
              <Input
                id="height"
                type="number"
                defaultValue={user.height ?? ""}
                readOnly
              />
            </Field>
            <Field label="Objetivo" htmlFor="goal">
              <Input id="goal" defaultValue={user.goal ?? ""} readOnly />
            </Field>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="text-h3 text-text-primary mb-3">Conta</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="md" disabled>
            <Pencil size={16} aria-hidden /> Editar dados
          </Button>
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
