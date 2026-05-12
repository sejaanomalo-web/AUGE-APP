import { cn } from "@/lib/utils";

export interface HeroCardProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: "subtle" | "medium" | "strong";
  /** When true, renders without the gold radial gradient. */
  bare?: boolean;
}

/**
 * Content-layer surface with a subtle gold radial glow in the corner.
 * Solid border + dark background — NOT a glass overlay. Use as the
 * headline block on any page.
 */
export function HeroCard({
  intensity = "medium",
  bare = false,
  className,
  children,
  ...props
}: HeroCardProps) {
  const gradientStyle =
    intensity === "subtle"
      ? "bg-[radial-gradient(circle_at_top_right,var(--accent-glow),transparent_70%)]"
      : intensity === "strong"
        ? "bg-[radial-gradient(circle_at_top_right,var(--accent-glow),transparent_30%)]"
        : "bg-[radial-gradient(circle_at_top_right,var(--accent-glow),transparent_50%)]";

  return (
    <div
      className={cn(
        "relative rounded-xl bg-bg-surface border border-border-subtle overflow-hidden",
        !bare && gradientStyle,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
