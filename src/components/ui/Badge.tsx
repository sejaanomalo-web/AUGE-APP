import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "in_progress"
  | "concluido"
  | "pulado"
  | "erro"
  | "info";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-accent-glow text-accent",
  in_progress: "bg-warning/15 text-warning",
  concluido: "bg-success/15 text-success",
  pulado: "bg-text-muted/15 text-text-muted",
  erro: "bg-error/15 text-error",
  info: "bg-info/15 text-info",
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
          "inline-flex items-center gap-1 text-micro uppercase tracking-[0.08em] font-semibold rounded-sm px-2 py-1",
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
