import { History } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 50;

export default async function NutricaoHistoricoPage() {
  const me = await requireRole("ALUNO");

  const logs = await prisma.mealLog.findMany({
    where: { studentId: me.id },
    orderBy: { date: "desc" },
    take: PAGE_SIZE,
    include: { meal: { include: { plan: true } } },
  });

  // Group by date string
  const byDay = new Map<string, typeof logs>();
  for (const l of logs) {
    const key = l.date.toISOString().slice(0, 10);
    const arr = byDay.get(key) ?? [];
    arr.push(l);
    byDay.set(key, arr);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Histórico"
        subtitle="Suas refeições registradas (últimas 50)"
      />

      {logs.length === 0 ? (
        <Card variant="default">
          <EmptyState
            icon={History}
            title="Nada registrado ainda"
            description="Registre suas refeições em Hoje pra começar a montar seu histórico."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {Array.from(byDay.entries()).map(([day, entries]) => (
            <section key={day}>
              <h2 className="text-h3 text-text-primary mb-2">{day}</h2>
              <div className="flex flex-col gap-2">
                {entries.map((l) => (
                  <Card key={l.id} variant="default" className="p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-body text-text-primary truncate">
                        {l.meal.name}
                      </span>
                      <span
                        className={
                          l.status === "LOGGED"
                            ? "text-caption text-success"
                            : l.status === "SKIPPED"
                              ? "text-caption text-text-muted"
                              : "text-caption text-warning"
                        }
                      >
                        {l.status === "LOGGED"
                          ? "registrado"
                          : l.status === "SKIPPED"
                            ? "pulado"
                            : "pendente"}
                      </span>
                    </div>
                    <p className="text-caption text-text-muted truncate">
                      {l.meal.plan.name}
                    </p>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
