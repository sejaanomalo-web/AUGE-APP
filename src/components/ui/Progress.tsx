import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  thin?: boolean;
}

export function Progress({
  value,
  max = 100,
  className,
  thin,
  ...props
}: ProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "w-full bg-bg-hover rounded-pill overflow-hidden",
        thin ? "h-1" : "h-1.5",
        className,
      )}
      {...props}
    >
      <div
        className="h-full bg-accent transition-[width] duration-300 ease-out rounded-pill"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
