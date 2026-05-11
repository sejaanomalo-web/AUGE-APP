import Link from "next/link";
import { LogOut, Pencil } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { alunosSummary, personal } from "@/lib/mock-data";

export default function PerfilPersonalPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Perfil" subtitle="Informações e configurações" />

      <Card variant="default" className="flex items-center gap-4 mb-6">
        <Avatar src={personal.avatar} name={personal.name} size={64} />
        <div className="flex-1 min-w-0">
          <p className="text-h2 text-text-primary truncate">{personal.name}</p>
          <p className="text-caption text-text-muted truncate">
            {personal.email}
          </p>
          <div className="mt-2">
            <Badge>Personal</Badge>
          </div>
        </div>
      </Card>

      <section className="mb-6">
        <h2 className="text-h3 text-text-primary mb-3">Profissional</h2>
        <Card variant="default">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="CREF" htmlFor="cref">
              <Input id="cref" defaultValue={personal.cref} readOnly />
            </Field>
            <Field label="Especialidade" htmlFor="spec">
              <Input
                id="spec"
                defaultValue="Hipertrofia e força"
                readOnly
              />
            </Field>
          </div>
        </Card>
      </section>

      <section className="mb-6">
        <h2 className="text-h3 text-text-primary mb-3">
          Alunos vinculados ({alunosSummary.length})
        </h2>
        <Card variant="default" className="p-0">
          <ul>
            {alunosSummary.map((s, i) => (
              <li
                key={s.user.id}
                className={
                  i !== alunosSummary.length - 1
                    ? "border-b border-border-subtle"
                    : ""
                }
              >
                <Link
                  href={`/alunos/${s.user.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-bg-elevated transition-colors"
                >
                  <Avatar src={s.user.avatar} name={s.user.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-body text-text-primary truncate">
                      {s.user.name}
                    </p>
                    <p className="text-caption text-text-muted truncate">
                      {s.plano}
                    </p>
                  </div>
                  <Badge>{s.aderencia}%</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section>
        <h2 className="text-h3 text-text-primary mb-3">Conta</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="md">
            <Pencil size={16} aria-hidden /> Editar dados
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
