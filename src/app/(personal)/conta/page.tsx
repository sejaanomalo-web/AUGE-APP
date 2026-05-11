import Link from "next/link";
import { Bell, LogOut } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { LinkButton } from "@/components/ui/LinkButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProfileEditor } from "@/components/shared/ProfileEditor";
import { requireRole } from "@/lib/auth-helpers";
import { getMyStudents } from "@/lib/actions/students";

export default async function PerfilPersonalPage() {
  const personal = await requireRole("PERSONAL");
  const links = await getMyStudents();

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Perfil" subtitle="Informações e configurações" />

      <ProfileEditor
        user={{
          id: personal.id,
          name: personal.name,
          email: personal.email,
          avatarUrl: personal.avatarUrl,
          phone: personal.phone,
          birthDate: personal.birthDate
            ? personal.birthDate.toISOString().slice(0, 10)
            : null,
          height: personal.height,
          currentWeight: personal.currentWeight,
          goal: personal.goal,
          cref: personal.cref,
          sportsPracticed:
            ((personal.sportsPracticed as string[] | null) ?? []),
          role: "PERSONAL",
        }}
      />

      <section className="mt-8 mb-6">
        <h2 className="text-h3 text-text-primary mb-3">
          Alunos vinculados ({links.length})
        </h2>
        {links.length === 0 ? (
          <Card variant="default">
            <p className="text-body text-text-secondary">
              Nenhum aluno vinculado ainda. Gere um código de convite em{" "}
              <Link href="/alunos" className="text-accent hover:underline">
                /alunos
              </Link>
              .
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
          <LinkButton href="/conta/notificacoes" variant="secondary" size="md">
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
