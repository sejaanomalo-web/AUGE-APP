"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Apple, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  mirrorRoute,
  detectVerticalFromPathname,
  type VerticalKey,
} from "@/lib/vertical/route-mirror";

interface VerticalToggleProps {
  available: VerticalKey[];
}

const META: Record<VerticalKey, { label: string; icon: React.ReactNode }> = {
  treinos: { label: "Treinos", icon: <Dumbbell size={14} aria-hidden /> },
  nutricao: { label: "Nutrição", icon: <Apple size={14} aria-hidden /> },
};

export function VerticalToggle({ available }: VerticalToggleProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const current = detectVerticalFromPathname(pathname);

  if (available.length < 2) return null;

  return (
    <div
      role="tablist"
      aria-label="Vertical"
      className="inline-flex items-center gap-0.5 bg-bg-elevated border border-border-subtle rounded-pill p-0.5"
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
              if (active) return;
              router.push(mirrorRoute(pathname, v));
            }}
            className={cn(
              "inline-flex items-center gap-1 px-3 py-1 rounded-pill text-caption font-semibold transition-colors",
              active
                ? "bg-accent text-text-on-accent"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {META[v].icon}
            <span className="hidden sm:inline">{META[v].label}</span>
          </button>
        );
      })}
    </div>
  );
}
