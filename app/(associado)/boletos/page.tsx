import { ChevronRight, FileText, PartyPopper } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/app/shell";
import { AppCard, EmptyState, Page, STATUS_LABEL, statusCor } from "@/components/app/ui";
import { requireAssociado } from "@/lib/auth/session";
import { formatCompetencia, formatData, formatMoeda } from "@/lib/format";
import { listarCobrancas, temMaisDeUmaPropriedade } from "@/lib/services/app";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Boletos" };

// Boletos: cobranças em aberto com atalho direto para o boleto.
export default async function BoletosPage() {
  const { associado } = await requireAssociado();
  const [abertas, variasProps] = await Promise.all([
    listarCobrancas(associado.id, "abertas"),
    temMaisDeUmaPropriedade(associado.id),
  ]);

  return (
    <>
      <AppHeader title="Boletos" back="/inicio" />
      <Page>
        {abertas.length === 0 ? (
          <EmptyState
            icon={<PartyPopper className="size-10" />}
            title="Nenhum boleto em aberto"
            text="Quando houver uma nova cobrança, o boleto aparecerá aqui."
          />
        ) : (
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
            {abertas.map((c) => (
              <Link key={c.id} href={`/pagamentos/${c.id}/boleto`}>
                <AppCard className="flex items-center gap-3 px-4 py-4 transition hover:bg-gray-50 lg:h-full">
                  <FileText className="size-9 shrink-0 text-brand-900" strokeWidth={1.8} />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium text-ink">{c.descricao}</p>
                    <p className="text-ink-muted">
                      Comp. {formatCompetencia(c.competencia)} · Venc. {formatData(c.vencimento)}
                    </p>
                    {variasProps && <p className="truncate text-xs text-ink-muted">{c.propriedade.nome}</p>}
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-ink">{formatMoeda(c.encargos.total)}</p>
                    <p className={cn("font-medium", statusCor(c.statusVisual))}>{STATUS_LABEL[c.statusVisual]}</p>
                  </div>
                  <ChevronRight className="-mr-1 size-4 text-ink-muted/60" />
                </AppCard>
              </Link>
            ))}
          </div>
        )}
      </Page>
    </>
  );
}
