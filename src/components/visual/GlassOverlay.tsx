import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface GlassOverlayProps
  extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: "subtle" | "medium" | "strong";
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
}

export const GlassOverlay = forwardRef<HTMLDivElement, GlassOverlayProps>(
  (
    { intensity = "medium", rounded = "2xl", className, children, ...props },
    ref,
  ) => {
    const intensityClass = {
      subtle: "glass-subtle",
      medium: "glass-medium",
      strong: "glass-strong",
    }[intensity];

    const roundedClass = {
      sm: "rounded-md",
      md: "rounded-lg",
      lg: "rounded-xl",
      xl: "rounded-2xl",
      "2xl": "rounded-[24px]",
      "3xl": "rounded-[32px]",
    }[rounded];

    return (
      <div
        ref={ref}
        className={cn(intensityClass, roundedClass, className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);

GlassOverlay.displayName = "GlassOverlay";
