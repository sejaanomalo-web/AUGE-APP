import { Badge } from "@/components/ui/Badge";

export type WorkoutStatus =
  | "concluido"
  | "em_andamento"
  | "pulado"
  | "nao_iniciado";

const labels: Record<WorkoutStatus, string> = {
  concluido: "Concluído",
  em_andamento: "Em andamento",
  pulado: "Pulado",
  nao_iniciado: "Não iniciado",
};

export function StatusBadge({ status }: { status: WorkoutStatus }) {
  const variantMap = {
    concluido: "concluido",
    em_andamento: "in_progress",
    pulado: "pulado",
    nao_iniciado: "default",
  } as const;

  return <Badge variant={variantMap[status]}>{labels[status]}</Badge>;
}
