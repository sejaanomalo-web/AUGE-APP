import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Liquid-Glass-inspired base: smooth motion, refined focus ring,
  // subtle press feedback. Pill geometry retained as the AUGE signature.
  "relative inline-flex items-center justify-center gap-2 font-sans transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none whitespace-nowrap rounded-pill active:scale-[0.97] select-none",
  {
    variants: {
      variant: {
        // Primary: gold glass-prominent — solid accent with inner specular
        // highlight + accent glow ring. Reads as "the action" on any layer.
        primary:
          "bg-accent text-text-on-accent font-semibold shadow-accent hover:bg-accent-hover hover:shadow-[0_14px_40px_-10px_rgba(201,149,58,0.6),inset_0_0_0_1px_rgba(201,149,58,0.5)] active:bg-accent-muted",
        // Secondary: liquid glass — translucent, blurred, inner top highlight.
        // Navigation-layer feel. Falls back gracefully without backdrop-filter.
        secondary:
          "glass-surface text-text-primary font-medium hover:bg-white/[0.08] hover:border-white/20",
        // Tertiary: invisible until hover — for low-emphasis inline actions.
        tertiary:
          "bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/[0.04] font-medium",
        // Destructive: outlined glass with red tint.
        destructive:
          "bg-error/[0.08] text-error border border-error/40 backdrop-blur-md hover:bg-error/15 hover:border-error/60 font-medium",
      },
      size: {
        sm: "h-9 px-4 text-[13px]",
        md: "h-11 px-5 text-[14px]",
        lg: "h-12 px-6 text-[15px]",
        // CTA: signature uppercase + wide tracking. Slightly taller for presence.
        cta: "min-h-[52px] px-8 py-3.5 text-[15px] tracking-btn uppercase font-bold",
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
    const isPrimary = variant === undefined || variant === "primary";
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        {...props}
      >
        {/* Inner specular highlight — only on solid primary, gives the
         * "liquid" lift effect at the top edge without overdoing it. */}
        {isPrimary && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-pill bg-gradient-to-b from-white/25 via-transparent to-black/10 mix-blend-overlay"
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
