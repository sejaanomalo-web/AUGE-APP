import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";
type LogoVariant = "default" | "mono";

const sizeClasses: Record<LogoSize, string> = {
  sm: "text-h3",
  md: "text-h1",
  lg: "text-display",
};

export function Logo({
  size = "md",
  variant = "default",
  className,
  ariaLabel = "ꓥuge",
}: {
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <span
      aria-label={ariaLabel}
      className={cn(
        "font-sans font-bold tracking-[-0.02em] leading-none",
        sizeClasses[size],
        variant === "default" ? "text-accent" : "text-text-on-accent",
        className,
      )}
    >
      ꓥuge
    </span>
  );
}
