import Link from "next/link";
import { LogOut, Pencil } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { requireRole } from "@/lib/auth-helpers";
import { getMyStudents } from "@/lib/actions/students";

export default async function PerfilPersonalPage() {
  const personal = await requireRole("PERSONAL");
  const links = await getMyStudents();

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Perfil" subtitle="Informações e configurações" />

      <Card variant="default" className="flex items-center gap-4 mb-6">
        <Avatar
          src={personal.avatarUrl ?? undefined}
          name={personal.name}
          size={64}
        />
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
              <Input id="cref" defaultValue={personal.cref ?? ""} readOnly />
            </Field>
            <Field label="Especialidade" htmlFor="spec">
              <Input id="spec" defaultValue={personal.goal ?? ""} readOnly />
            </Field>
          </div>
        </Card>
      </section>

      <section className="mb-6">
        <h2 className="text-h3 text-text-primary mb-3">
          Alunos vinculados ({links.length})
        </h2>
        {links.length === 0 ? (
          <Card variant="default">
            <p className="text-body text-text-secondary">
              Nenhum aluno vinculado ainda. Gere um código de convite em{" "}
              <Link href="/alunos" className="text-accent hover:underline">
                /alunos
              </Link>{" "}
              e compartilhe com o aluno.
            </p>
          </Card>
        ) : (
          <Card variant="default" className="p-0">
            <ul>
              {links.map((l, i) => (
                <li
                  key={l.studentId}
                  className={
                    i !== links.length - 1
                      ? "border-b border-border-subtle"
                      : ""
                  }
                >
                  <Link
                    href={`/alunos/${l.studentId}`}
                    className="flex items-center gap-3 p-3 hover:bg-bg-elevated transition-colors"
                  >
                    <Avatar
                      src={l.student.avatarUrl ?? undefined}
                      name={l.student.name}
                      size={36}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-body text-text-primary truncate">
                        {l.student.name}
                      </p>
                      <p className="text-caption text-text-muted truncate">
                        {l.student.email}
                      </p>
                    </div>
                    <Badge
                      variant={l.status === "ACTIVE" ? "concluido" : "pulado"}
                    >
                      {l.status === "ACTIVE" ? "Ativo" : "Pausado"}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
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
