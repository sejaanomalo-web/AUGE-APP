import { cn } from "@/lib/utils";

export type StatusDotVariant =
  | "em_andamento"
  | "concluido"
  | "pulado"
  | "nao_iniciado";

const variantClasses: Record<StatusDotVariant, string> = {
  em_andamento: "bg-warning animate-pulse-dot",
  concluido: "bg-success",
  pulado: "bg-text-muted",
  nao_iniciado: "bg-border",
};

export function StatusDot({
  status,
  className,
}: {
  status: StatusDotVariant;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block w-2 h-2 rounded-full shrink-0",
        variantClasses[status],
        className,
      )}
    />
  );
}
