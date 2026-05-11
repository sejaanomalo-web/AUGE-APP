import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  delta,
  icon: Icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  delta?: { value: string; positive?: boolean };
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-bg-surface rounded-lg p-4 flex flex-col gap-2 min-w-0",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 text-text-secondary">
        <span className="text-caption">{label}</span>
        {Icon && <Icon size={16} aria-hidden className="text-text-muted" />}
      </div>
      <div className="text-h1 text-text-primary tnum truncate">{value}</div>
      {(hint || delta) && (
        <div className="flex items-center gap-2 text-caption text-text-muted">
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
