import { ChartNoAxesColumnIncreasing, TrendingDown, TrendingUp, Wheat } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { AppHeader } from "@/components/app/shell";
import { AppCard, EmptyState, Page, Row } from "@/components/app/ui";
import { requireAssociado } from "@/lib/auth/session";
import { formatDataHora, formatMoeda } from "@/lib/format";
import { cotacoes } from "@/lib/services/app";

export const metadata: Metadata = { title: "Cotação do arroz" };

const SIGLA_UF: Record<string, string> = { "Santa Catarina": "SC", "Rio Grande do Sul": "RS" };

// Tela 8 — Cotação do arroz
export default async function CotacaoPage() {
  await requireAssociado();
  const lista = await cotacoes();
  const atual = lista[0];

  return (
    <>
      <AppHeader title="Cotação do Arroz" back="/inicio" />
      <Page>
        {!atual ? (
          <EmptyState icon={<Wheat className="size-10" />} title="Nenhuma cotação publicada ainda" />
        ) : (
          <>
            <AppCard className="overflow-hidden">
              <div className="relative h-24 w-full">
                <Image src="/img/arroz.jpg" alt="Lavoura de arroz" fill sizes="430px" className="object-cover" priority />
              </div>
              <div className="space-y-1 p-4">
                <p className="text-[15px] font-medium text-ink">
                  {atual.produto} – {SIGLA_UF[atual.regiao] ?? atual.regiao}
                </p>
                <p className="text-3xl font-bold text-brand-700">{formatMoeda(atual.valorCentavos)}</p>
                <p className="text-sm text-ink-muted">{atual.unidade}</p>
                <p className="pt-2 text-xs text-ink-muted">Atualizado em: {formatDataHora(atual.referenciaEm)}</p>
                <a
                  href="#historico"
                  className="mt-3 flex h-11 items-center justify-center gap-2 rounded-lg border border-black/10 text-[15px] font-medium text-brand-900 hover:bg-gray-50"
                >
                  <ChartNoAxesColumnIncreasing className="size-5 text-brand-500" strokeWidth={2.6} />
                  Histórico de cotações
                </a>
              </div>
              <div className="border-t border-black/5 px-4 py-2">
                <Row label="Região" value={atual.regiao} />
                <Row label="Fonte" value={atual.fonte} />
                <p className="pt-2 pb-1 text-xs text-ink-muted">A cotação pode sofrer variações durante o dia.</p>
              </div>
            </AppCard>

            <h2 id="historico" className="scroll-mt-16 px-1 pt-2 text-sm font-medium text-ink">
              Histórico de cotações
            </h2>
            <AppCard className="divide-y divide-black/5">
              {lista.map((c, i) => {
                const anterior = lista[i + 1];
                const diff = anterior ? c.valorCentavos - anterior.valorCentavos : 0;
                return (
                  <div key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <p className="text-ink">{formatDataHora(c.referenciaEm).slice(0, 10)}</p>
                      <p className="text-xs text-ink-muted">{c.fonte}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {diff > 0 && <TrendingUp className="size-4 text-brand-500" />}
                      {diff < 0 && <TrendingDown className="size-4 text-danger-600" />}
                      <span className="font-medium text-ink">{formatMoeda(c.valorCentavos)}</span>
                    </div>
                  </div>
                );
              })}
            </AppCard>
          </>
        )}
      </Page>
    </>
  );
}
