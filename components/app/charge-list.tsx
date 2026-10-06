import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { StatusVisual } from "@/lib/domain/cobranca";
import { formatData, formatMoeda } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AppCard, STATUS_LABEL, StatusIcon, statusCor } from "./ui";

export type ChargeItem = {
  id: string;
  descricao: string;
  vencimento: string;
  valor: number;
  status: StatusVisual;
  propriedade?: string | null;
  href: string;
};

/** Item de cobrança/pagamento (Telas 4 e 11). */
export function ChargeListItem({ item, dataLabel }: { item: ChargeItem; dataLabel?: string }) {
  return (
    <Link href={item.href}>
      <AppCard className="flex items-center gap-3 px-4 py-4 transition hover:bg-gray-50">
        <StatusIcon status={item.status} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{item.descricao}</p>
          <p className="text-sm text-ink-muted">{dataLabel ?? formatData(item.vencimento)}</p>
          {item.propriedade && <p className="truncate text-xs text-ink-muted">{item.propriedade}</p>}
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-ink">{formatMoeda(item.valor)}</p>
          <p className={cn("text-sm font-medium", statusCor(item.status))}>{STATUS_LABEL[item.status]}</p>
        </div>
        <ChevronRight className="-mr-1 size-4 text-ink-muted/60" />
      </AppCard>
    </Link>
  );
}
