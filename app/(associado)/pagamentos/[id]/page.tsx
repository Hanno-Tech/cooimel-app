import { CircleCheck, FileText, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import { ShareButton } from "@/components/app/client-buttons";
import { AppHeader } from "@/components/app/shell";
import { AppCard, ChargeSummary, LinkBotao, Page, PixIcon, Row, botao } from "@/components/app/ui";
import { requireAssociado } from "@/lib/auth/session";
import { formatData, formatDataHora, formatHa, formatMoeda } from "@/lib/format";
import { obterCobranca, temMaisDeUmaPropriedade } from "@/lib/services/app";
import { Download } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Detalhes da cobrança" };

const pct = (bp: number) => `${(bp / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

// Tela 5 — Detalhes da cobrança / Tela 7 — Pagamento em atraso
export default async function CobrancaPage({ params }: PageProps<"/pagamentos/[id]">) {
  const { id } = await params;
  const { associado } = await requireAssociado();
  const [c, variasProps] = await Promise.all([obterCobranca(associado.id, id), temMaisDeUmaPropriedade(associado.id)]);
  const e = c.encargos;
  const vencida = c.statusVisual === "vencida";
  const paga = c.status === "paga";
  const pagamento = c.pagamentos[0];
  const propriedade = variasProps ? c.propriedade.nome : null;

  if (vencida) {
    return (
      <>
        <AppHeader title="Pagamento em atraso" back="/pagamentos" />
        <Page>
          <div className="flex items-center gap-3 rounded-lg bg-danger-600 px-4 py-3 font-bold text-white shadow-sm">
            <TriangleAlert className="size-6 fill-white text-danger-600" />
            PAGAMENTO EM ATRASO
          </div>
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6">
            <AppCard className="overflow-hidden">
              <ChargeSummary
                descricao={c.descricao}
                competencia={c.competencia}
                vencimento={c.vencimento}
                propriedade={propriedade}
                className="border-b border-black/5"
              />
              <div className="px-4 py-2">
                <Row label="Valor original" value={formatMoeda(e.principal)} />
                <Row label={`Multa (${pct(c.multaBp)})`} value={formatMoeda(e.multa)} />
                <Row label={`Juros (${pct(c.jurosMesBp)} ao mês)`} value={formatMoeda(e.juros)} />
                <Row label="Dias em atraso" value={e.diasAtraso} className="text-ink-muted" />
              </div>
              <div className="flex items-center justify-between bg-danger-50 px-4 py-3.5 text-[15px] font-bold text-danger-600">
                <span>Total atualizado</span>
                <span>{formatMoeda(e.total)}</span>
              </div>
            </AppCard>
            <div className="flex flex-col gap-3">
              <LinkBotao href={`/pagamentos/${c.id}/pix`} variant="perigo" className="mt-1 lg:mt-0">
                PAGAR AGORA
              </LinkBotao>
              <LinkBotao href={`/pagamentos/${c.id}/boleto`} variant="contorno">
                <FileText className="size-5" /> Gerar boleto atualizado
              </LinkBotao>
              <p className="px-6 text-center text-sm text-ink-muted lg:px-2">
                Os valores de multa e juros podem ser alterados pela cooperativa.
              </p>
            </div>
          </div>
        </Page>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Detalhes da Cobrança" back="/pagamentos" />
      <Page>
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6">
          <AppCard className="overflow-hidden">
            <ChargeSummary
              descricao={c.descricao}
              competencia={c.competencia}
              vencimento={c.vencimento}
              propriedade={propriedade}
              className="m-2 rounded-lg bg-[#f0f7fb]"
            />
            <div className="px-4 pb-2">
              <Row label="Área irrigada" value={formatHa(c.areaIrrigadaHa)} />
              <Row label="Valor por hectare" value={formatMoeda(c.valorHaCentavos)} />
              <Row label="Valor principal" value={formatMoeda(e.principal)} />
              <Row label="Multa" value={formatMoeda(e.multa)} />
              <Row label="Juros" value={formatMoeda(e.juros)} />
            </div>
            <div className="mx-2 mb-2 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-3 text-[17px] font-bold text-brand-700">
              <span className="text-ink">Total</span>
              <span>{formatMoeda(paga && pagamento ? pagamento.valorPagoCentavos : e.total)}</span>
            </div>
          </AppCard>

          <div className="flex flex-col gap-3">
            {paga ? (
              <AppCard className="flex items-center gap-3 p-4">
                <CircleCheck className="size-9 shrink-0 fill-brand-500 text-white" />
                <div className="text-sm">
                  <p className="font-medium text-brand-600">Pago</p>
                  {pagamento && (
                    <p className="text-ink-muted">
                      {formatDataHora(pagamento.pagoEm)} ·{" "}
                      {pagamento.forma === "pix"
                        ? "Pix"
                        : pagamento.forma === "boleto"
                          ? "Boleto"
                          : "Baixa na cooperativa"}
                    </p>
                  )}
                </div>
              </AppCard>
            ) : (
              <>
                <LinkBotao href={`/pagamentos/${c.id}/boleto`}>
                  <FileText className="size-5" /> GERAR BOLETO
                </LinkBotao>
                <LinkBotao href={`/pagamentos/${c.id}/pix`} variant="contorno">
                  <PixIcon className="size-6 text-[#32bcad]" /> PAGAR COM PIX
                </LinkBotao>
                <div className="flex gap-3">
                  <Link href={`/pagamentos/${c.id}/boleto/imprimir`} className={botao.pequeno}>
                    <Download className="size-4 text-brand-700" /> Baixar boleto
                  </Link>
                  <ShareButton
                    className={botao.pequeno}
                    title="Cobrança COOIMEL"
                    text={`${c.descricao} — vencimento ${formatData(c.vencimento)} — ${formatMoeda(e.total)}`}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </Page>
    </>
  );
}
