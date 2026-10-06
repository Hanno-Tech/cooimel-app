import { Check } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app/shell";
import { AppCard, LinkBotao, Page, Row } from "@/components/app/ui";
import { requireAssociado } from "@/lib/auth/session";
import { formatCompetencia, formatDataHora, formatMoeda } from "@/lib/format";
import { obterCobranca } from "@/lib/services/app";

export const metadata: Metadata = { title: "Pagamento realizado" };

const FORMA = { pix: "Pix", boleto: "Boleto", manual: "Baixa na cooperativa" } as const;

// Tela 14 — Confirmação de pagamento
export default async function SucessoPage({ params }: PageProps<"/pagamentos/[id]/sucesso">) {
  const { id } = await params;
  const { associado } = await requireAssociado();
  const c = await obterCobranca(associado.id, id);
  const p = c.pagamentos[0];
  if (c.status !== "paga" || !p) redirect(`/pagamentos/${id}`);

  return (
    <>
      <AppHeader title="Pagamento Realizado" back="/inicio" />
      <Page>
        <AppCard className="flex flex-col items-center gap-5 px-5 py-8">
          <div className="flex size-20 items-center justify-center rounded-full bg-brand-600 shadow-md">
            <Check className="size-11 text-white" strokeWidth={3} />
          </div>
          <p className="text-center text-lg font-bold text-brand-600">Pagamento efetuado com sucesso!</p>
          <div className="w-full border-t border-black/5 pt-3">
            <Row label="Competência:" value={formatCompetencia(c.competencia)} />
            <Row label="Data:" value={formatDataHora(p.pagoEm)} />
            <Row label="Valor:" value={formatMoeda(p.valorPagoCentavos)} />
            <Row label="Forma de pagamento:" value={FORMA[p.forma]} />
          </div>
          <LinkBotao href="/inicio" className="mt-2">
            Voltar para o início
          </LinkBotao>
        </AppCard>
      </Page>
    </>
  );
}
