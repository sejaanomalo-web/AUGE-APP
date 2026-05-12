import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  delta,
  icon: Icon,
  className,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  delta?: { value: string; positive?: boolean };
  icon?: LucideIcon;
  className?: string;
  /** Solid gold tone — use sparingly for a single hero stat. */
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md p-4 flex flex-col gap-2 min-w-0 border",
        accent
          ? "bg-accent text-text-on-accent border-accent shadow-accent"
          : "bg-bg-surface border-border-subtle shadow-sm",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2",
          accent ? "text-text-on-accent/80" : "text-text-secondary",
        )}
      >
        <span className="text-caption font-semibold">{label}</span>
        {Icon && (
          <Icon
            size={16}
            aria-hidden
            className={accent ? "text-text-on-accent/80" : "text-text-muted"}
          />
        )}
      </div>
      <div
        className={cn(
          "text-h1 tnum truncate",
          accent ? "text-text-on-accent font-bold" : "text-text-primary",
        )}
      >
        {value}
      </div>
      {(hint || delta) && (
        <div
          className={cn(
            "flex items-center gap-2 text-caption",
            accent ? "text-text-on-accent/80" : "text-text-muted",
          )}
        >
          {delta && (
            <span
              className={cn(
                "tnum font-semibold",
                delta.positive ? "text-success" : "text-error",
              )}
            >
              {delta.value}
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      )}
    </div>
  );
}
