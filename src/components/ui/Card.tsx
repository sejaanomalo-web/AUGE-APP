import * as React from "react";
import { cn } from "@/lib/utils";

type CardVariant =
  | "default"
  | "elevated"
  | "interactive"
  | "highlight"
  | "accent"
  | "coach"
  | "intensity";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  asButton?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  default:
    "bg-bg-surface border border-border-subtle p-4 shadow-sm pulse-line",
  elevated:
    "bg-bg-elevated border border-border-subtle p-5 shadow-md pulse-line",
  interactive:
    "bg-bg-surface border border-border-subtle p-4 shadow-sm cursor-pointer transition duration-150 hover:bg-bg-elevated hover:border-border-strong hover:shadow-md hover:-translate-y-px active:translate-y-0 pulse-line",
  highlight:
    "relative bg-gradient-to-br from-bg-elevated via-bg-card to-bg-elevated border border-accent/30 p-5 shadow-accent pulse-line",
  accent:
    "relative bg-accent text-text-on-accent border border-accent p-5 shadow-accent overflow-hidden",
  coach:
    "relative bg-gradient-to-br from-coach/20 via-bg-surface to-bg-elevated border border-coach/35 p-5 shadow-coach pulse-line",
  intensity:
    "relative bg-gradient-to-br from-intensity/20 via-bg-surface to-bg-elevated border border-intensity/35 p-5 shadow-intensity pulse-line",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("rounded-xl", variantClasses[variant], className)}
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
