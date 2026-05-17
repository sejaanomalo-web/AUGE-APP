import { cn } from "@/lib/utils";

export interface StatHeroVariation {
  value: number;
  type: "positive" | "negative" | "neutral";
}

export interface StatHeroProps {
  value: React.ReactNode;
  label: string;
  variation?: StatHeroVariation;
  size?: "sm" | "md" | "lg" | "hero";
  italic?: boolean;
  className?: string;
}

export function StatHero({
  value,
  label,
  variation,
  size = "md",
  italic = false,
  className,
}: StatHeroProps) {
  const sizeClass = {
    sm: "text-stat-medium",
    md: "text-stat-large",
    lg: "text-stat-hero",
    hero: "text-[80px] leading-[0.9] font-extrabold",
  }[size];

  return (
    <div className={cn("flex flex-col gap-2 min-w-0", className)}>
      <div className="text-stat-label text-text-muted uppercase">{label}</div>
      <div
        className={cn(
          sizeClass,
          italic && "italic",
          "text-text-primary font-mono-num tracking-normal",
        )}
      >
        {value}
      </div>
      {variation && (
        <div
          className={cn(
            "text-caption font-bold inline-flex items-center gap-1",
            variation.type === "positive" && "text-success",
            variation.type === "negative" && "text-error",
            variation.type === "neutral" && "text-text-muted",
          )}
        >
          {variation.type === "positive" && "↑"}
          {variation.type === "negative" && "↓"}
          {Math.abs(variation.value)}%
        </div>
      )}
    </div>
  );
}
