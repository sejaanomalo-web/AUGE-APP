import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "in_progress"
  | "concluido"
  | "pulado"
  | "erro"
  | "info"
  | "warning"
  | "intensity"
  | "coach"
  | "new";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-accent/10 text-accent border-accent/25",
  in_progress: "bg-warning/10 text-warning border-warning/30",
  concluido: "bg-success/10 text-success border-success/30",
  pulado: "bg-text-muted/10 text-text-secondary border-border-subtle",
  erro: "bg-error/10 text-error border-error/30",
  info: "bg-info/10 text-info border-info/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  intensity: "bg-intensity/10 text-intensity border-intensity/30",
  coach: "bg-coach/15 text-white border-coach/35",
  new: "bg-accent text-text-on-accent border-accent",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 text-[11px] uppercase tracking-normal font-bold rounded-pill border px-2.5 py-1.5 leading-none",
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";
