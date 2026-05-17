import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className,
      )}
    >
      {Icon && (
        <Icon
          size={64}
          strokeWidth={1.5}
          className="text-accent/55 mb-4"
          aria-hidden
        />
      )}
      <h3 className="text-h3 text-text-primary">{title}</h3>
      {description && (
        <p className="mt-2 max-w-[320px] text-body text-text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
