import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            "w-full appearance-none bg-bg-surface text-text-primary border border-border-subtle rounded-lg min-h-[48px] px-3.5 py-3 pr-10 text-body-lg transition-colors duration-200 focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-glow disabled:opacity-40 disabled:cursor-not-allowed",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
          size={20}
        />
      </div>
    );
  },
);

Select.displayName = "Select";
