import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-busy
      aria-label="Carregando"
      className={cn(
        "rounded-md skeleton",
        className,
      )}
      {...props}
    />
  );
}
