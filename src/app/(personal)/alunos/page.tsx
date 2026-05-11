"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StudentCard } from "@/components/personal/StudentCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Users } from "lucide-react";
import { alunosSummary } from "@/lib/mock-data";

export default function AlunosPage() {
  const [q, setQ] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("todos");

  const filtered = alunosSummary.filter((s) => {
    const matchesQ =
      q === "" || s.user.name.toLowerCase().includes(q.toLowerCase());
    const matchesStatus =
      statusFilter === "todos" || s.status === statusFilter;
    return matchesQ && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Alunos"
        subtitle={`${alunosSummary.length} alunos vinculados`}
        actions={
          <Button variant="primary" size="md">
            <Plus size={18} aria-hidden /> Adicionar aluno
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            aria-hidden
          />
          <Input
            placeholder="Buscar por nome..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10 rounded-pill"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:max-w-[200px]"
        >
          <option value="todos">Todos</option>
          <option value="ativo">Ativos</option>
          <option value="pausado">Pausados</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum aluno encontrado"
          description="Tente ajustar os filtros ou adicione um novo aluno."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((s) => (
            <StudentCard key={s.user.id} s={s} />
          ))}
        </div>
      )}
    </div>
  );
}
