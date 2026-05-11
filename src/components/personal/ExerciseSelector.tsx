"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";

export interface ExerciseOption {
  id: string;
  name: string;
  muscleGroup: string;
}

const MUSCLE_GROUPS = [
  "Todos",
  "Peito",
  "Costas",
  "Pernas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Abdômen",
  "Cardio",
];

export function ExerciseSelector({
  value,
  options,
  onChange,
  className,
}: {
  value: string;
  options: ExerciseOption[];
  onChange: (id: string) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [group, setGroup] = React.useState("Todos");
  const [q, setQ] = React.useState("");

  const selected = options.find((o) => o.id === value);

  const filtered = options.filter((e) => {
    if (group !== "Todos" && e.muscleGroup !== group) return false;
    if (q && !e.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  function handlePick(id: string) {
    onChange(id);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setQ("");
          setGroup(selected?.muscleGroup ?? "Todos");
          setOpen(true);
        }}
        className={cn(
          "w-full min-w-0 inline-flex items-center justify-between gap-2 h-11 px-3.5 rounded-md bg-bg-elevated border border-border-subtle text-text-primary text-body hover:bg-bg-hover transition-colors text-left",
          className,
        )}
      >
        <span className="flex-1 truncate font-medium">
          {selected?.name ?? "Selecionar exercício"}
        </span>
        <ChevronDown
          size={16}
          className="text-text-secondary shrink-0"
          aria-hidden
        />
      </button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Selecionar exercício"
        className="max-w-[560px]"
      >
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              aria-hidden
            />
            <Input
              placeholder="Buscar exercício..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-10 rounded-pill"
              autoFocus
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
            {MUSCLE_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroup(g)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-pill text-[12px] font-semibold transition-colors",
                  group === g
                    ? "bg-accent text-text-on-accent"
                    : "bg-bg-elevated text-text-secondary hover:text-text-primary",
                )}
              >
                {g}
              </button>
            ))}
          </div>

          <ul className="max-h-[400px] overflow-y-auto flex flex-col gap-1">
            {filtered.length === 0 ? (
              <li className="text-caption text-text-muted text-center py-6">
                Nenhum exercício encontrado.
              </li>
            ) : (
              filtered.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(e.id)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                      e.id === value
                        ? "bg-accent-glow text-accent"
                        : "text-text-primary hover:bg-bg-hover",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-body font-medium truncate">
                        {e.name}
                      </p>
                      <p className="text-caption text-text-muted">
                        {e.muscleGroup}
                      </p>
                    </div>
                    {e.id === value && (
                      <Check size={16} className="text-accent shrink-0" />
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </Dialog>
    </>
  );
}
