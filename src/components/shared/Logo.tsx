import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";
type LogoVariant = "default" | "mono";

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
        "font-sans font-extrabold tracking-normal",
        sizeClasses[size],
        variant === "default" ? "text-accent" : "text-text-on-accent",
        className,
      )}
    >
      ꓥuge
    </span>
  );
}
