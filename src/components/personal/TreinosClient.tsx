"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  CheckCircle2,
  Filter,
  MoreVertical,
  Pause,
  PlayCircle,
  Search,
  Target,
} from "lucide-react";
import { AvatarStack } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/shared/EmptyState";
import { setPlanStatus, type PlanStatus } from "@/lib/actions/workout-plans";
import { formatLongDate } from "@/lib/date";
import { cn } from "@/lib/utils";

export interface TreinoCardData {
  id: string;
  name: string;
  studentId: string;
  studentName: string;
  studentAvatarUrl: string | null;
  sessionsCount: number;
  startDateIso: string;
  endDateIso: string | null;
  status: PlanStatus;
}

type StatusFilter = "ALL" | PlanStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "PAUSED", label: "Pausado" },
  { value: "INACTIVE", label: "Inativo" },
];

function statusBadge(status: PlanStatus) {
  if (status === "ACTIVE") {
    return { variant: "concluido" as const, label: "Ativo" };
  }
  if (status === "PAUSED") {
    return { variant: "warning" as const, label: "Pausado" };
  }
  return { variant: "pulado" as const, label: "Inativo" };
}

export function TreinosClient({ plans }: { plans: TreinoCardData[] }) {
  const router = useRouter();
  const [items, setItems] = React.useState(plans);
  const [search, setSearch] = React.useState("");
  const [studentId, setStudentId] = React.useState<string>("ALL");
  const [status, setStatus] = React.useState<StatusFilter>("ALL");
  const [year, setYear] = React.useState<string>("ALL");

  // Keep local state in sync if the server payload changes (e.g. after a
  // status update triggers router.refresh()).
  React.useEffect(() => {
    setItems(plans);
  }, [plans]);

  // Student dropdown options: distinct {id,name} pairs ordered by name.
  const studentOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const p of items) {
      if (!map.has(p.studentId)) map.set(p.studentId, p.studentName);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [items]);

  // Year options derived from plan.startDate so the filter only ever
  // offers years that actually have plans behind them.
  const yearOptions = React.useMemo(() => {
    const set = new Set<number>();
    for (const p of items) {
      set.add(new Date(p.startDateIso).getFullYear());
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [items]);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((p) => {
      if (term && !p.name.toLowerCase().includes(term)) return false;
      if (studentId !== "ALL" && p.studentId !== studentId) return false;
      if (status !== "ALL" && p.status !== status) return false;
      if (year !== "ALL") {
        const y = new Date(p.startDateIso).getFullYear();
        if (String(y) !== year) return false;
      }
      return true;
    });
  }, [items, search, studentId, status, year]);

  async function handleStatusChange(planId: string, next: PlanStatus) {
    const snapshot = items;
    setItems((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, status: next } : p)),
    );
    const res = await setPlanStatus(planId, next);
    if (!res.ok) {
      setItems(snapshot);
      window.alert(res.error);
      return;
    }
    router.refresh();
  }

  const anyFilterActive =
    search.trim() !== "" ||
    studentId !== "ALL" ||
    status !== "ALL" ||
    year !== "ALL";

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar pelo nome do treino"
          className="pl-10 rounded-pill"
        />
      </div>

      {/* Aluno + Ano */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="treinos-aluno"
            className="block text-stat-label uppercase text-text-muted mb-1.5"
          >
            Aluno
          </label>
          <Select
            id="treinos-aluno"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            <option value="ALL">Todos os alunos</option>
            {studentOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label
            htmlFor="treinos-ano"
            className="block text-stat-label uppercase text-text-muted mb-1.5"
          >
            Ano de início
          </label>
          <Select
            id="treinos-ano"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="ALL">Qualquer ano</option>
            {yearOptions.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Status chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
        <Filter
          size={16}
          aria-hidden
          className="text-text-muted shrink-0"
        />
        {STATUS_FILTERS.map((s) => {
          const active = status === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              className={cn(
                "shrink-0 h-9 px-4 rounded-pill text-caption font-semibold border transition-[background-color,border-color,color,transform] duration-200 ease-out active:scale-[0.97]",
                active
                  ? "bg-accent text-text-on-accent border-accent shadow-accent"
                  : "bg-bg-surface text-text-secondary border-border-subtle hover:text-text-primary hover:bg-bg-elevated",
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Result count + reset */}
      {anyFilterActive && (
        <div className="flex items-center justify-between text-caption text-text-muted">
          <span>
            {filtered.length} de {items.length}{" "}
            {items.length === 1 ? "plano" : "planos"}
          </span>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStudentId("ALL");
              setStatus("ALL");
              setYear("ALL");
            }}
            className="text-accent font-semibold hover:text-accent-hover"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        anyFilterActive ? (
          <EmptyState
            icon={Filter}
            title="Nenhum treino encontrado"
            description="Tente afrouxar os filtros - mude o aluno, o status ou o ano."
          />
        ) : (
          <EmptyState
            icon={Target}
            title="Nenhum plano criado"
            description="Crie seu primeiro plano de treino e prescreva exercícios para um aluno."
          />
        )
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              onChangeStatus={(next) => handleStatusChange(p.id, next)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  onChangeStatus,
}: {
  plan: TreinoCardData;
  onChangeStatus: (next: PlanStatus) => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Click-away closes the menu - PlanCard is purely client-side state.
  React.useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const badge = statusBadge(plan.status);

  return (
    <div className="relative">
      <Link href={`/treinos/${plan.id}`} className="block">
        <Card variant="interactive">
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge>{plan.sessionsCount}x semana</Badge>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
              <p className="text-h3 text-text-primary truncate">{plan.name}</p>
              <p className="text-caption text-text-muted truncate">
                {plan.studentName} ·{" "}
                {formatLongDate(plan.startDateIso)}
                {plan.endDateIso
                  ? ` - ${formatLongDate(plan.endDateIso)}`
                  : ""}
              </p>
            </div>
            <AvatarStack
              users={[
                {
                  name: plan.studentName,
                  src: plan.studentAvatarUrl ?? undefined,
                },
              ]}
            />
            {/* Spacer so the corner kebab doesn't overlap the avatar */}
            <div className="w-9 shrink-0" aria-hidden />
          </div>
        </Card>
      </Link>

      {/* Kebab menu lives outside the <Link> so clicks don't navigate. */}
      <div ref={menuRef} className="absolute top-3 right-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          aria-label="Ações do plano"
          aria-expanded={menuOpen}
          className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
        >
          <MoreVertical size={16} aria-hidden />
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-1 min-w-[180px] rounded-xl border border-border-subtle bg-bg-elevated shadow-xl py-1 z-10 surface-depth"
          >
            <MenuItem
              icon={CheckCircle2}
              label="Marcar como ativo"
              disabled={plan.status === "ACTIVE"}
              onSelect={() => {
                setMenuOpen(false);
                onChangeStatus("ACTIVE");
              }}
            />
            <MenuItem
              icon={Pause}
              label="Pausar"
              disabled={plan.status === "PAUSED"}
              onSelect={() => {
                setMenuOpen(false);
                onChangeStatus("PAUSED");
              }}
            />
            <MenuItem
              icon={Archive}
              label="Inativar"
              disabled={plan.status === "INACTIVE"}
              onSelect={() => {
                setMenuOpen(false);
                onChangeStatus("INACTIVE");
              }}
            />
            <Link
              href={`/treinos/${plan.id}/editar`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-body text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
              role="menuitem"
            >
              <PlayCircle size={14} aria-hidden /> Editar conteúdo
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  disabled,
  onSelect,
}: {
  icon: typeof CheckCircle2;
  label: string;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 text-body text-left transition-colors",
        disabled
          ? "text-text-muted opacity-50 cursor-not-allowed"
          : "text-text-secondary hover:text-text-primary hover:bg-bg-hover",
      )}
    >
      <Icon size={14} aria-hidden /> {label}
    </button>
  );
}
