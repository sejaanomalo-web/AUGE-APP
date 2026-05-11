"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { exercises, muscleGroups } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function ExerciciosPage() {
  const [q, setQ] = React.useState("");
  const [active, setActive] = React.useState<string>("Todos");

  const filtered = exercises.filter((e) => {
    const matchQ = q === "" || e.name.toLowerCase().includes(q.toLowerCase());
    const matchG = active === "Todos" || e.muscleGroup === active;
    return matchQ && matchG;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Exercícios"
        subtitle={`${exercises.length} exercícios na biblioteca`}
        actions={
          <Button variant="primary" size="md">
            <Plus size={18} aria-hidden /> Adicionar exercício
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          aria-hidden
        />
        <Input
          placeholder="Buscar exercício..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none -mx-1 px-1">
        {(["Todos", ...muscleGroups] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setActive(g)}
            className={cn(
              "shrink-0 px-3 py-2 rounded-pill text-body font-semibold transition-colors",
              active === g
                ? "bg-accent text-text-on-accent"
                : "bg-bg-elevated text-text-secondary hover:text-text-primary",
            )}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((e) => (
          <Card key={e.id} variant="interactive">
            <div
              aria-hidden
              className="aspect-[4/3] rounded-md bg-gradient-to-br from-bg-elevated to-bg-card border border-border-subtle mb-3 flex items-center justify-center"
            >
              <span className="text-[64px] leading-none select-none">
                {e.muscleGroup === "Cardio" ? "🏃" : "💪"}
              </span>
            </div>
            <Badge>{e.muscleGroup}</Badge>
            <p className="mt-2 text-body-lg font-semibold text-text-primary truncate">
              {e.name}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
