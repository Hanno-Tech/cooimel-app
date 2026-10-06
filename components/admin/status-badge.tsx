import type { StatusVisual } from "@/lib/domain/cobranca";
import { cn } from "@/lib/utils";

const estilos: Record<StatusVisual, [string, string]> = {
  paga: ["Paga", "bg-brand-50 text-brand-700"],
  a_vencer: ["A vencer", "bg-amber-50 text-amber-700"],
  vence_hoje: ["Vence hoje", "bg-amber-100 text-amber-800"],
  vencida: ["Vencida", "bg-danger-50 text-danger-600"],
  cancelada: ["Cancelada", "bg-gray-100 text-gray-500"],
};

export function StatusBadge({ status }: { status: StatusVisual }) {
  const [label, cls] = estilos[status];
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", cls)}>{label}</span>;
}
