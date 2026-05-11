import Link from "next/link";
import { LogOut, Pencil, Repeat } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { aluno, personal } from "@/lib/mock-data";

export default function PerfilAlunoPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Perfil" subtitle="Suas informações e configurações" />

      <Card variant="default" className="flex items-center gap-4 mb-6">
        <Avatar src={aluno.avatar} name={aluno.name} size={64} />
        <div className="flex-1 min-w-0">
          <p className="text-h2 text-text-primary truncate">{aluno.name}</p>
          <p className="text-caption text-text-muted truncate">{aluno.email}</p>
          <div className="mt-2">
            <Badge>Aluno</Badge>
          </div>
        </div>
      </Card>

      <section className="mb-6">
        <h2 className="text-h3 text-text-primary mb-3">Personal vinculado</h2>
        <Card variant="default" className="flex items-center gap-4">
          <Avatar src={personal.avatar} name={personal.name} size={48} />
          <div className="flex-1 min-w-0">
            <p className="text-body-lg font-semibold text-text-primary truncate">
              {personal.name}
            </p>
            <p className="text-caption text-text-muted truncate">
              {personal.email}
            </p>
          </div>
          <Button variant="secondary" size="md">
            <Repeat size={16} aria-hidden /> Trocar
          </Button>
        </Card>
      </section>

      <section className="mb-6">
        <h2 className="text-h3 text-text-primary mb-3">Dados pessoais</h2>
        <Card variant="default">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Data de nascimento" htmlFor="birth">
              <Input
                id="birth"
                type="date"
                defaultValue={aluno.birthDate}
                readOnly
              />
            </Field>
            <Field label="Telefone" htmlFor="phone">
              <Input id="phone" defaultValue={aluno.phone} readOnly />
            </Field>
            <Field label="Altura (cm)" htmlFor="height">
              <Input
                id="height"
                type="number"
                defaultValue={aluno.heightCm}
                readOnly
              />
            </Field>
            <Field label="Objetivo" htmlFor="goal">
              <Input id="goal" defaultValue={aluno.goal} readOnly />
            </Field>
            <Field label="Observações" htmlFor="notes" className="sm:col-span-2">
              <Textarea
                id="notes"
                readOnly
                defaultValue="Sem restrições. Histórico de bursite no ombro esquerdo (manter aquecimento bem feito antes de supino)."
              />
            </Field>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="text-h3 text-text-primary mb-3">Conta</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="md">
            <Pencil size={16} aria-hidden /> Editar dados
          </Button>
          <Button variant="secondary" size="md">
            Trocar senha
          </Button>
          <Link href="/">
            <Button variant="destructive" size="md">
              <LogOut size={16} aria-hidden /> Sair
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
