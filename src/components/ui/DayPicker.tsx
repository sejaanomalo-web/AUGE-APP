"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS: Array<{ value: string; short: string; full: string }> = [
  { value: "segunda", short: "Seg", full: "Segunda" },
  { value: "terca", short: "Ter", full: "Terça" },
  { value: "quarta", short: "Qua", full: "Quarta" },
  { value: "quinta", short: "Qui", full: "Quinta" },
  { value: "sexta", short: "Sex", full: "Sexta" },
  { value: "sabado", short: "Sáb", full: "Sábado" },
  { value: "domingo", short: "Dom", full: "Domingo" },
];

export function DayPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const selected = DAYS.find((d) => d.value === value) ?? DAYS[0];

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 h-11 px-3 rounded-md bg-bg-elevated border border-border-subtle text-text-primary text-body font-medium hover:bg-bg-hover transition-colors min-w-[100px]"
      >
        <span className="flex-1 text-left">{selected.short}</span>
        <ChevronDown
          size={16}
          className={cn(
            "text-text-secondary transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1 z-30 w-44 bg-bg-card rounded-md shadow-lg p-1 animate-fade-in"
        >
          {DAYS.map((d) => (
            <button
              key={d.value}
              type="button"
              role="option"
              aria-selected={d.value === value}
              onClick={() => {
                onChange(d.value);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2 rounded text-body transition-colors",
                d.value === value
                  ? "bg-accent-glow text-accent font-semibold"
                  : "text-text-primary hover:bg-bg-hover",
              )}
            >
              {d.full}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const DAY_VALUES = DAYS.map((d) => d.value);
