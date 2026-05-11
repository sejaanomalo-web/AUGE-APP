import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-sans transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none whitespace-nowrap",
  {
    variants: {
      variant: {
        // Primary: pill dourado — APENAS CTAs principais
        primary:
          "bg-accent text-text-on-accent hover:bg-accent-hover active:bg-accent-muted rounded-pill font-bold",
        // Secondary: rounded escuro
        secondary:
          "bg-bg-elevated text-text-primary border border-border hover:bg-bg-hover hover:border-accent rounded-md font-semibold",
        // Tertiary: ghost dourado
        tertiary:
          "bg-transparent text-accent hover:bg-accent-glow rounded-md font-semibold",
        // Destructive
        destructive:
          "bg-transparent text-error border border-error hover:bg-error/10 rounded-md font-semibold",
      },
      size: {
        sm: "h-9 px-3 text-body",
        md: "h-11 px-4 text-body",
        lg: "h-12 px-6 text-body-lg",
        // Training CTA size (Iniciar Treino / Finalizar)
        cta: "min-h-[48px] px-7 py-3.5 text-training-cta",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { buttonVariants };
