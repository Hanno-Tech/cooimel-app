import { Info, Megaphone, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

type Tipo = "manutencao" | "assembleia" | "orientacao";

const ESTILO: Record<Tipo, { bg: string; icon: typeof Info }> = {
  manutencao: { bg: "bg-danger-600", icon: Megaphone },
  assembleia: { bg: "bg-brand-500", icon: Info },
  orientacao: { bg: "bg-info-500", icon: Pencil },
};

export function AvisoIcon({ tipo, className }: { tipo: Tipo; className?: string }) {
  const { bg, icon: Icon } = ESTILO[tipo];
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full text-white", bg, className)}>
      <Icon className="size-5" strokeWidth={2.4} />
    </span>
  );
}
