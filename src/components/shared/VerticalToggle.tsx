"use client";

import * as React from "react";
import { Apple, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerticalKey } from "@/lib/vertical/route-mirror";

const META: Record<VerticalKey, { label: string; icon: React.ReactNode }> = {
  treinos: { label: "Treinos", icon: <Dumbbell size={13} aria-hidden /> },
  nutricao: { label: "Nutrição", icon: <Apple size={13} aria-hidden /> },
};

/**
 * Toggle CONTROLADO: o estado ativo vem de `current` (a vertical resolvida
 * pelo shell, que respeita a vertical lembrada em rotas compartilhadas como
 * /perfil), não do pathname. Senão, ao abrir o Perfil estando em Nutrição, o
 * toggle voltava a destacar "Treinos". A troca em si é delegada ao `onSelect`.
 */
export function VerticalToggle({
  available,
  current,
  onSelect,
}: {
  available: VerticalKey[];
  current: VerticalKey;
  onSelect: (v: VerticalKey) => void;
}) {
  if (available.length < 2) return null;

  return (
    <div
      role="tablist"
      aria-label="Vertical"
      data-tour="vertical-toggle"
      className="inline-flex items-center gap-0.5 bg-bg-elevated border border-border-subtle rounded-pill p-0.5 scale-110 origin-center"
    >
      {(["treinos", "nutricao"] as const).map((v) => {
        if (!available.includes(v)) return null;
        const active = v === current;
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              if (!active) onSelect(v);
            }}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold transition-colors",
              active
                ? "bg-accent text-text-on-accent"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {META[v].icon}
            <span>{META[v].label}</span>
          </button>
        );
      })}
    </div>
  );
}
