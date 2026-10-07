import type { Metadata } from "next";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { AguardarPagamento, CopyButton, SimularPagamentoButton } from "@/components/app/client-buttons";
import { AppHeader } from "@/components/app/shell";
import { AppCard, LinkBotao, Page, botao } from "@/components/app/ui";
import { requireAssociado } from "@/lib/auth/session";
import { formatData, formatMoeda } from "@/lib/format";
import { ehMock } from "@/lib/payments";
import { obterCobranca } from "@/lib/services/app";
import { obterOuCriarInstrumento } from "@/lib/services/pagamentos";

export const metadata: Metadata = { title: "Pagamento Pix" };

// Tela 13 — Pagamento Pix
export default async function PixPage({ params }: PageProps<"/pagamentos/[id]/pix">) {
  const { id } = await params;
  const { associado } = await requireAssociado();
  const c = await obterCobranca(associado.id, id);
  if (c.status === "paga") redirect(`/pagamentos/${id}/sucesso`);
  if (c.status !== "aberta") redirect(`/pagamentos/${id}`);

  const pix = await obterOuCriarInstrumento(c.id, "pix");
  const codigo = pix.pixCopiaCola ?? "";
  const svg = await QRCode.toString(codigo, { type: "svg", margin: 0, errorCorrectionLevel: "M" });

  return (
    <>
      <AppHeader title="Pagamento Pix" back={`/pagamentos/${id}`} />
      <Page largura="estreita">
        <AppCard className="flex flex-col gap-4 p-4 lg:grid lg:grid-cols-2 lg:items-center lg:gap-8 lg:p-6">
          <div className="flex flex-col items-center gap-3 pt-2 lg:pt-0">
            <div className="size-44 lg:size-56 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
            <p className="text-center text-sm text-ink">
              Escaneie o QR Code e pague
              <br />
              com o seu app do banco.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between border-t border-black/5 pt-3 lg:border-t-0 lg:pt-0">
              <div>
                <p className="text-sm text-ink-muted">Valor</p>
                <p className="text-lg font-bold text-ink">{formatMoeda(pix.valorCentavos)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-ink-muted">Vencimento</p>
                <p className="text-[15px] text-ink">{formatData(c.vencimento)}</p>
              </div>
            </div>
            <CopyButton
              text={codigo}
              label="Copiar código Pix"
              doneMessage="Código Pix copiado!"
              className={botao.suave + " h-11 text-sm font-medium"}
            />
            <LinkBotao href={`/pagamentos/${id}`} variant="neutro" className="h-11 text-sm">
              Voltar
            </LinkBotao>
            <AguardarPagamento cobrancaId={id} />
          </div>
        </AppCard>
        {ehMock() && <SimularPagamentoButton cobrancaId={id} tipo="pix" />}
      </Page>
    </>
  );
}
