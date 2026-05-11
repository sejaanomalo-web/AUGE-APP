import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";
type LogoVariant = "default" | "mono";

// Sizes scaled +30% over previous typographic baselines (h3 / h1 / display).
const sizeClasses: Record<LogoSize, string> = {
  sm: "text-[23px] leading-none",
  md: "text-[31px] leading-none",
  lg: "text-[42px] leading-none",
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
        "font-sans font-bold tracking-[-0.02em]",
        sizeClasses[size],
        variant === "default" ? "text-accent" : "text-text-on-accent",
        className,
      )}
    >
      ꓥuge
    </span>
  );
}
