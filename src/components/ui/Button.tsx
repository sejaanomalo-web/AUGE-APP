import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 font-sans transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none whitespace-nowrap rounded-pill active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-text-on-accent font-bold shadow-accent hover:bg-accent-hover hover:shadow-[0_18px_42px_-14px_rgba(183,255,42,0.68),inset_0_0_0_1px_rgba(183,255,42,0.44)] active:bg-accent-muted",
        secondary:
          "bg-bg-elevated text-text-primary border border-border-subtle font-semibold shadow-sm hover:bg-bg-hover hover:border-border-strong",
        tertiary:
          "bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated font-semibold",
        coach:
          "bg-coach text-white font-bold shadow-coach hover:bg-coach/90",
        intensity:
          "bg-intensity text-white font-bold shadow-intensity hover:bg-intensity/90",
        destructive:
          "bg-error/[0.10] text-error border border-error/40 hover:bg-error/15 hover:border-error/60 font-semibold",
      },
      size: {
        sm: "h-9 px-4 text-[13px]",
        md: "h-11 px-5 text-[14px]",
        lg: "h-12 px-6 text-[15px]",
        cta: "min-h-[56px] px-8 py-4 text-[15px] tracking-btn uppercase font-bold",
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
  ({ className, variant, size, fullWidth, type = "button", children, ...props }, ref) => {
    const isSolid =
      variant === undefined ||
      variant === "primary" ||
      variant === "coach" ||
      variant === "intensity";
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        {...props}
      >
        {isSolid && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-pill bg-gradient-to-b from-white/20 to-transparent"
          />
        )}
        <span className="relative z-[1] inline-flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  },
);

Button.displayName = "Button";

export { buttonVariants };
