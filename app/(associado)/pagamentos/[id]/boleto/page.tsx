import { CircleCheck, FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Barcode } from "@/components/app/barcode";
import { CopyButton, ShareButton, SimularPagamentoButton } from "@/components/app/client-buttons";
import { AppHeader } from "@/components/app/shell";
import { AppCard, LinkBotao, Page, PixIcon, botao } from "@/components/app/ui";
import { requireAssociado } from "@/lib/auth/session";
import { formatCompetencia, formatData, formatMoeda } from "@/lib/format";
import { ehMock } from "@/lib/payments";
import { obterCobranca } from "@/lib/services/app";
import { obterOuCriarInstrumento } from "@/lib/services/pagamentos";
import { Download } from "lucide-react";

export const metadata: Metadata = { title: "Boleto" };

// Tela 6 — Boleto / Pix (gerado ou reaproveitado — Tela 12)
export default async function BoletoPage({ params }: PageProps<"/pagamentos/[id]/boleto">) {
  const { id } = await params;
  const { associado } = await requireAssociado();
  const c = await obterCobranca(associado.id, id);
  if (c.status !== "aberta") redirect(`/pagamentos/${id}`);

  const boleto = await obterOuCriarInstrumento(c.id, "boleto");
  const linha = boleto.linhaDigitavel ?? "";

  return (
    <>
      <AppHeader title="Boleto / Pix" back={`/pagamentos/${id}`} />
      <Page>
        <AppCard className="flex flex-col gap-4 p-4 lg:grid lg:grid-cols-[1fr_300px] lg:gap-8 lg:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <FileText className="mt-1 size-11 shrink-0 text-brand-900" strokeWidth={1.8} />
              <div className="text-sm leading-relaxed">
                <p className="text-base font-medium text-ink">{c.descricao}</p>
                <p className="text-ink-muted">Competência: {formatCompetencia(c.competencia)}</p>
                <p className="text-ink-muted">Vencimento: {formatData(c.vencimento)}</p>
                <p className="font-bold text-ink">Total: {formatMoeda(boleto.valorCentavos)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Barcode value={boleto.codigoBarras ?? ""} className="h-16 w-full lg:h-20" />
              <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-ink">
                <CircleCheck className="size-4 fill-brand-500 text-white" /> Boleto gerado com sucesso!
              </p>
              <p className="rounded-md bg-gray-50 px-2 py-2 text-center font-mono text-[11px] tracking-tight break-all text-ink">
                {linha}
              </p>
              <CopyButton
                text={linha.replace(/\D/g, "")}
                label="Copiar linha digitável"
                doneMessage="Linha digitável copiada!"
                className={botao.suave + " h-10 text-sm font-medium"}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:justify-center lg:border-l lg:border-black/5 lg:pl-8">
            <LinkBotao href={`/pagamentos/${id}/boleto/imprimir`}>Visualizar boleto</LinkBotao>
            <LinkBotao href={`/pagamentos/${id}/pix`} variant="primario" className="bg-brand-500">
              <PixIcon className="size-5" /> Pagar com Pix
            </LinkBotao>
            <div className="flex gap-3">
              <Link href={`/pagamentos/${id}/boleto/imprimir`} className={botao.pequeno}>
                <Download className="size-4 text-brand-700" /> Baixar boleto
              </Link>
              <ShareButton
                className={botao.pequeno}
                title="Boleto COOIMEL"
                text={`Boleto ${c.descricao} (${formatCompetencia(c.competencia)}) — ${formatMoeda(boleto.valorCentavos)}\nLinha digitável: ${linha}`}
              />
            </div>
          </div>
        </AppCard>
        {ehMock() && <SimularPagamentoButton cobrancaId={id} tipo="boleto" />}
      </Page>
    </>
  );
}
