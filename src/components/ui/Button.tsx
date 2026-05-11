import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Spotify-style buttons: pill on every variant, uppercase + wide tracking.
  "inline-flex items-center justify-center gap-2 font-sans uppercase tracking-btn transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none whitespace-nowrap rounded-pill",
  {
    variants: {
      variant: {
        // Primary: Spotify Green pill
        primary:
          "bg-accent text-text-on-accent hover:bg-accent-hover active:bg-accent-muted font-bold hover:scale-[1.02]",
        // Secondary: dark pill with outline
        secondary:
          "bg-bg-elevated text-text-primary border border-border hover:bg-bg-hover hover:border-text-primary font-bold",
        // Tertiary: ghost
        tertiary:
          "bg-transparent text-text-secondary hover:text-text-primary font-bold",
        // Destructive
        destructive:
          "bg-transparent text-error border border-error hover:bg-error/10 font-bold",
      },
      size: {
        sm: "h-9 px-4 text-[12px] tracking-btn-tight",
        md: "h-11 px-5 text-[14px]",
        lg: "h-12 px-6 text-[14px]",
        // Training CTA size (Iniciar Treino / Finalizar)
        cta: "min-h-[48px] px-8 py-3.5 text-[16px] tracking-[0.12em]",
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
