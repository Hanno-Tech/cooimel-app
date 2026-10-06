import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Barcode } from "@/components/app/barcode";
import { PrintButton } from "@/components/app/client-buttons";
import { botao } from "@/components/app/ui";
import { requireAssociado } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatCompetencia, formatCpf, formatData, formatHa, formatMoeda } from "@/lib/format";
import { ehMock } from "@/lib/payments";
import { obterCobranca } from "@/lib/services/app";
import { obterOuCriarInstrumento } from "@/lib/services/pagamentos";

export const metadata: Metadata = { title: "Boleto" };

// Boleto imprimível (layout FEBRABAN simplificado). "Baixar" = imprimir/salvar em PDF.
export default async function ImprimirBoletoPage({ params }: PageProps<"/pagamentos/[id]/boleto/imprimir">) {
  const { id } = await params;
  const { associado } = await requireAssociado();
  const c = await obterCobranca(associado.id, id);
  if (c.status !== "aberta") redirect(`/pagamentos/${id}`);
  const [boleto, config] = await Promise.all([
    obterOuCriarInstrumento(c.id, "boleto"),
    db.query.configuracao.findFirst(),
  ]);

  const cell = "border border-black/60 px-2 py-1 align-top";
  const lab = "block text-[9px] uppercase text-black/60";

  return (
    <div className="min-h-dvh bg-[#dfe5e2] p-3 print:bg-white print:p-0">
      <div className="mx-auto mb-3 flex max-w-[760px] gap-3 print:hidden">
        <Link href={`/pagamentos/${id}/boleto`} className={botao.neutro + " h-10 text-sm"}>
          Voltar
        </Link>
        <PrintButton className={botao.primario + " h-10 text-sm"} label="Baixar / Imprimir" />
      </div>

      <div className="mx-auto max-w-[760px] bg-white p-5 text-[11px] text-black shadow print:max-w-none print:shadow-none">
        {ehMock() && (
          <p className="mb-3 rounded border border-dashed border-warning-500 px-2 py-1 text-center text-[10px] text-warning-500">
            AMBIENTE DE TESTE — este boleto não tem valor de pagamento
          </p>
        )}
        <div className="flex items-end gap-3 border-b-2 border-black pb-1">
          <span className="text-base font-bold">Cresol</span>
          <span className="border-x-2 border-black px-3 text-base font-bold">133</span>
          <span className="flex-1 text-right font-mono text-[13px] font-bold">{boleto.linhaDigitavel}</span>
        </div>
        <div className="overflow-x-auto"><table className="mt-1 w-full min-w-[560px] border-collapse">
          <tbody>
            <tr>
              <td className={cell} colSpan={4}>
                <span className={lab}>Local de pagamento</span>Pagável em qualquer banco ou via Pix
              </td>
              <td className={cell}>
                <span className={lab}>Vencimento</span>
                <b>{formatData(c.vencimento)}</b>
              </td>
            </tr>
            <tr>
              <td className={cell} colSpan={4}>
                <span className={lab}>Beneficiário</span>
                {config?.coopNome ?? "Cooperativa de Irrigação de Meleiro"}
                {config?.coopCnpj ? ` — CNPJ ${config.coopCnpj}` : ""}
              </td>
              <td className={cell}>
                <span className={lab}>Nosso número</span>
                {boleto.providerRef.slice(-12)}
              </td>
            </tr>
            <tr>
              <td className={cell}>
                <span className={lab}>Data do documento</span>
                {formatData(c.createdAt.toISOString())}
              </td>
              <td className={cell}>
                <span className={lab}>Competência</span>
                {formatCompetencia(c.competencia)}
              </td>
              <td className={cell}>
                <span className={lab}>Espécie</span>R$
              </td>
              <td className={cell}>
                <span className={lab}>Área irrigada</span>
                {formatHa(c.areaIrrigadaHa)}
              </td>
              <td className={cell}>
                <span className={lab}>(=) Valor do documento</span>
                <b>{formatMoeda(boleto.valorCentavos)}</b>
              </td>
            </tr>
            <tr>
              <td className={cell + " h-16"} colSpan={5}>
                <span className={lab}>Instruções</span>
                {c.descricao} — {c.propriedade.nome}.{" "}
                {c.multaBp > 0 && `Após o vencimento, multa de ${(c.multaBp / 100).toLocaleString("pt-BR")}%. `}
                {c.jurosMesBp > 0 && `Juros de ${(c.jurosMesBp / 100).toLocaleString("pt-BR")}% ao mês.`}
              </td>
            </tr>
            <tr>
              <td className={cell} colSpan={5}>
                <span className={lab}>Pagador</span>
                {associado.nome} — CPF {formatCpf(associado.cpf)} — Matrícula {associado.matricula}
              </td>
            </tr>
          </tbody>
        </table></div>
        <Barcode value={boleto.codigoBarras ?? ""} className="mt-4 h-14 w-[103mm] max-w-full" />
      </div>
    </div>
  );
}
