import { CalendarCheck } from "lucide-react";
import type { Metadata } from "next";
import { ChargeListItem } from "@/components/app/charge-list";
import { AppHeader } from "@/components/app/shell";
import { EmptyState, Page, SegmentedTabs } from "@/components/app/ui";
import { requireAssociado } from "@/lib/auth/session";
import { hojeISO } from "@/lib/format";
import { anosComCobranca, listarCobrancas, temMaisDeUmaPropriedade, type FiltroCobranca } from "@/lib/services/app";
import { YearSelect } from "./year-select";

export const metadata: Metadata = { title: "Pagamentos" };

const FILTROS: { value: FiltroCobranca; label: string }[] = [
  { value: "abertas", label: "Em aberto" },
  { value: "pagas", label: "Pagos" },
  { value: "todas", label: "Todos" },
];

// Tela 4 — Pagamentos
export default async function PagamentosPage({ searchParams }: PageProps<"/pagamentos">) {
  const sp = await searchParams;
  const { associado } = await requireAssociado();
  const filtro = (FILTROS.find((f) => f.value === sp.filtro)?.value ?? "todas") as FiltroCobranca;

  const anos = await anosComCobranca(associado.id);
  const anoAtual = Number(hojeISO().slice(0, 4));
  const anoParam = Number(sp.ano);
  const ano = anos.includes(anoParam) ? anoParam : anos.includes(anoAtual) ? anoAtual : (anos[0] ?? anoAtual);

  const [cobrancas, variasProps] = await Promise.all([
    listarCobrancas(associado.id, filtro, ano),
    temMaisDeUmaPropriedade(associado.id),
  ]);

  return (
    <>
      <AppHeader title="Pagamentos" back="/inicio" />
      <Page>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="lg:w-[420px]">
            <SegmentedTabs
              ativo={filtro}
              items={FILTROS.map((f) => ({ ...f, href: `/pagamentos?filtro=${f.value}&ano=${ano}` }))}
            />
          </div>
          <div className="lg:w-40">
            <YearSelect anos={anos.length ? anos : [anoAtual]} ano={ano} filtro={filtro} />
          </div>
        </div>
        {cobrancas.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="size-10" />}
            title="Nenhuma cobrança encontrada"
            text={filtro === "abertas" ? "Você não tem cobranças em aberto neste ano." : undefined}
          />
        ) : (
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
            {cobrancas.map((c) => (
              <ChargeListItem
                key={c.id}
                item={{
                  id: c.id,
                  descricao: c.descricao,
                  vencimento: c.vencimento,
                  valor: c.encargos.total,
                  status: c.statusVisual,
                  propriedade: variasProps ? c.propriedade.nome : null,
                  href: `/pagamentos/${c.id}`,
                }}
              />
            ))}
          </div>
        )}
      </Page>
    </>
  );
}
