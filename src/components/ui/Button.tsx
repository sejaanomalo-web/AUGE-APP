import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Refined: pill geometry kept (Spotify-inspired), UPPERCASE only on CTA size.
  // Smooth transitions, subtle scale on press, premium focus ring.
  "inline-flex items-center justify-center gap-2 font-sans transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none whitespace-nowrap rounded-pill active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-text-on-accent shadow-sm hover:bg-accent-hover hover:shadow-accent active:bg-accent-muted font-semibold",
        secondary:
          "bg-bg-elevated text-text-primary border border-border-subtle hover:bg-bg-hover hover:border-border font-medium",
        tertiary:
          "bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated/60 font-medium",
        destructive:
          "bg-transparent text-error border border-error/60 hover:bg-error/10 hover:border-error font-medium",
      },
      size: {
        sm: "h-9 px-4 text-[13px]",
        md: "h-11 px-5 text-[14px]",
        lg: "h-12 px-6 text-[15px]",
        // CTA: only place that keeps UPPERCASE + wide tracking — Spotify staple.
        cta: "min-h-[48px] px-8 py-3.5 text-[15px] tracking-[0.1em] uppercase font-bold",
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
