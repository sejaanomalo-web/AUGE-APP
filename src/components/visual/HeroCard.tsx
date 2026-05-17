import { cn } from "@/lib/utils";

export interface HeroCardProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: "subtle" | "medium" | "strong";
  /** When true, renders without the performance glow treatment. */
  bare?: boolean;
}

/**
 * Headline performance surface with a subtle Pulse Line and restrained glow.
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
      ? "bg-[linear-gradient(135deg,rgba(29,78,216,0.10),transparent_42%),radial-gradient(circle_at_top_right,var(--accent-glow),transparent_70%)]"
      : intensity === "strong"
        ? "bg-[linear-gradient(135deg,rgba(29,78,216,0.18),transparent_38%),radial-gradient(circle_at_top_right,var(--accent-glow),transparent_38%)]"
        : "bg-[linear-gradient(135deg,rgba(29,78,216,0.14),transparent_44%),radial-gradient(circle_at_top_right,var(--accent-glow),transparent_56%)]";

  return (
    <div
      className={cn(
        "relative rounded-2xl bg-bg-surface border border-border-subtle overflow-hidden shadow-lg pulse-line",
        !bare && gradientStyle,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
