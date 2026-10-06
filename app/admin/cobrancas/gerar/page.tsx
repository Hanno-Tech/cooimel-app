import Link from "next/link";
import { GerarLoteForm } from "@/components/admin/gerar-lote-form";
import { PageHeader, Panel, Vazio } from "@/components/admin/page-header";
import { Campo } from "@/components/admin/campo";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { formatCompetencia, formatData, hojeISO } from "@/lib/format";
import { bpParaInput, centavosParaInput, parseMoeda } from "@/lib/parse";
import { obterConfiguracao, previaLote } from "@/lib/services/cobrancas-admin";

export const metadata = { title: "Gerar cobranças" };

function vencimentoPadrao(competencia: string, dia: number) {
  const [y, m] = competencia.split("-").map(Number);
  const ultimo = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${competencia}-${String(Math.min(dia, ultimo)).padStart(2, "0")}`;
}

export default async function GerarPage({ searchParams }: PageProps<"/admin/cobrancas/gerar">) {
  await requireAdmin();
  const sp = await searchParams;
  const cfg = await obterConfiguracao();
  const competencia = /^\d{4}-\d{2}$/.test(String(sp.competencia)) ? String(sp.competencia) : hojeISO().slice(0, 7);
  const vencimento = /^\d{4}-\d{2}-\d{2}$/.test(String(sp.vencimento))
    ? String(sp.vencimento)
    : vencimentoPadrao(competencia, cfg.diaVencimentoPadrao);
  const valorHaStr = sp.valorHa ? String(sp.valorHa) : centavosParaInput(cfg.valorHaCentavos);
  const valorHa = parseMoeda(valorHaStr) ?? 0;
  const descricao = String(sp.descricao ?? "Taxa de irrigação");
  const previsualizar = sp.previa === "1";
  const itens = previsualizar && valorHa > 0 ? await previaLote(competencia, valorHa) : [];

  return (
    <>
      <Link href="/admin/cobrancas" className="text-sm text-ink-muted hover:text-ink">
        ← Cobranças
      </Link>
      <PageHeader
        titulo="Gerar cobranças"
        descricao="Uma cobrança por propriedade ativa: área irrigada × valor por hectare."
      />

      <Panel className="mb-6 p-6">
        <form className="grid grid-cols-[repeat(4,minmax(0,1fr))_auto] items-end gap-4">
          <input type="hidden" name="previa" value="1" />
          <Campo name="competencia" label="Competência" type="month" defaultValue={competencia} required />
          <Campo name="vencimento" label="Vencimento" type="date" defaultValue={vencimento} required />
          <Campo name="valorHa" label="Valor por hectare (R$)" inputMode="decimal" defaultValue={valorHaStr} required />
          <Campo name="descricao" label="Descrição" defaultValue={descricao} />
          <Button size="lg" variant="outline">
            Pré-visualizar
          </Button>
        </form>
        <p className="mt-3 text-xs text-ink-muted">
          Encargos por atraso aplicados nesta emissão: multa {bpParaInput(cfg.multaBp)}% e juros{" "}
          {bpParaInput(cfg.jurosMesBp)}% a.m. ({cfg.jurosProRata ? "pro rata" : "mês cheio"}).{" "}
          <Link href="/admin/configuracoes" className="underline">
            Alterar em Configurações
          </Link>
          .
        </p>
      </Panel>

      {previsualizar && (
        <Panel>
          <div className="border-b px-5 py-3 text-sm">
            Competência <strong>{formatCompetencia(competencia)}</strong> · vencimento{" "}
            <strong>{formatData(vencimento)}</strong>
          </div>
          {valorHa <= 0 ? (
            <Vazio>Informe um valor por hectare maior que zero.</Vazio>
          ) : itens.length === 0 ? (
            <Vazio>Nenhuma propriedade ativa com área irrigada. Cadastre associados e propriedades primeiro.</Vazio>
          ) : (
            <GerarLoteForm
              key={`${competencia}-${vencimento}-${valorHa}`}
              itens={itens}
              competencia={competencia}
              vencimento={vencimento}
              valorHa={valorHaStr}
              descricao={descricao}
            />
          )}
        </Panel>
      )}
    </>
  );
}
