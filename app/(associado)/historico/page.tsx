import { History } from "lucide-react";
import type { Metadata } from "next";
import { ChargeListItem } from "@/components/app/charge-list";
import { AppHeader } from "@/components/app/shell";
import { EmptyState, Page, SegmentedTabs } from "@/components/app/ui";
import { requireAssociado } from "@/lib/auth/session";
import { formatDataHora, hojeISO } from "@/lib/format";
import { listarPagamentos, temMaisDeUmaPropriedade } from "@/lib/services/app";

export const metadata: Metadata = { title: "Histórico de pagamentos" };

const ABAS = [
  { value: "todos", label: "Todos" },
  { value: "boleto", label: "Boleto" },
  { value: "pix", label: "Pix" },
] as const;

// Tela 11 — Histórico de pagamentos
export default async function HistoricoPage({ searchParams }: PageProps<"/historico">) {
  const sp = await searchParams;
  const { associado } = await requireAssociado();
  const aba = ABAS.find((a) => a.value === sp.forma)?.value ?? "todos";
  const [pagamentos, variasProps] = await Promise.all([
    listarPagamentos(associado.id, aba === "todos" ? undefined : aba),
    temMaisDeUmaPropriedade(associado.id),
  ]);

  return (
    <>
      <AppHeader title="Histórico de Pagamentos" back="/inicio" />
      <Page>
        <SegmentedTabs ativo={aba} items={ABAS.map((a) => ({ ...a, href: `/historico?forma=${a.value}` }))} />
        {pagamentos.length === 0 ? (
          <EmptyState icon={<History className="size-10" />} title="Nenhum pagamento registrado" />
        ) : (
          pagamentos.map((p) => (
            <ChargeListItem
              key={p.id}
              dataLabel={formatDataHora(p.pagoEm).slice(0, 10)}
              item={{
                id: p.id,
                descricao: p.descricao,
                vencimento: hojeISO(p.pagoEm),
                valor: p.valorPagoCentavos,
                status: "paga",
                propriedade: variasProps ? p.propriedade : null,
                href: `/pagamentos/${p.cobrancaId}`,
              }}
            />
          ))
        )}
      </Page>
    </>
  );
}
