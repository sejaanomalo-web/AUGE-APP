import * as React from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "elevated" | "interactive" | "highlight";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  asButton?: boolean;
}

// Cards are CONTENT-layer surfaces — solid darks, hairline borders, deep
// shadows for elevation. We deliberately keep glass off content (per Apple
// HIG: glass is for navigation/floating layers, not lists/cards/media).
const variantClasses: Record<CardVariant, string> = {
  default:
    "bg-bg-surface border border-border-subtle p-4 shadow-sm",
  elevated:
    "bg-bg-elevated border border-border-subtle p-5 shadow-md",
  interactive:
    "bg-bg-surface border border-border-subtle p-4 shadow-sm cursor-pointer transition-all duration-200 hover:bg-bg-elevated hover:border-border hover:shadow-md hover:-translate-y-px active:translate-y-0",
  highlight:
    "relative bg-gradient-to-br from-bg-elevated via-bg-card to-bg-elevated border border-accent/30 p-5 shadow-accent",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("rounded-lg", variantClasses[variant], className)}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between gap-3 mb-3", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-h3 text-text-primary", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-body text-text-secondary", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn(className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-3 mt-4", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";
