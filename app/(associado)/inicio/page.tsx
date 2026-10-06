import { CircleAlert, CircleCheck, Droplet, FileText, Files, Leaf, Megaphone, PartyPopper, Wheat } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/app/shell";
import { AppCard, Page } from "@/components/app/ui";
import { requireAssociado } from "@/lib/auth/session";
import { formatData, formatHa, formatMoeda } from "@/lib/format";
import { dadosInicio } from "@/lib/services/app";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Início" };

// Tela 3 — Tela principal
export default async function InicioPage() {
  const { associado } = await requireAssociado();
  const d = await dadosInicio(associado.id);
  const primeiroNome = associado.nome.split(" ")[0];
  const emAtraso = d.situacao === "EM ATRASO";

  return (
    <>
      <AppHeader />
      <Page>
        <div className="px-1 pt-1">
          <h2 className="text-[22px] font-medium text-ink">
            Olá, {primeiroNome} <span aria-hidden>👋</span>
          </h2>
          <p className="text-sm text-ink-muted">Matrícula: {associado.matricula}</p>
        </div>

        <AppCard className="grid grid-cols-2 divide-x divide-black/5 py-3">
          <div className="flex items-center gap-3 px-4">
            <Leaf className="size-8 shrink-0 fill-[#6ab42d] text-[#4f9a1f]" />
            <div>
              <p className="text-xs text-ink-muted">Área cadastrada</p>
              <p className="text-xl font-bold text-ink">{formatHa(d.areaCadastrada)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4">
            <Droplet className="size-8 shrink-0 fill-info-500 text-info-500" />
            <div>
              <p className="text-xs text-ink-muted">Área irrigada</p>
              <p className="text-xl font-bold text-ink">{formatHa(d.areaIrrigada)}</p>
            </div>
          </div>
        </AppCard>

        {d.qtdAbertas > 0 ? (
          <Link href="/pagamentos?filtro=abertas">
            <div className="flex items-center gap-4 rounded-xl border border-danger-600/15 bg-danger-50 px-4 py-3.5 shadow-[0_1px_4px_rgb(0_0_0/0.06)]">
              <CircleAlert className="size-10 shrink-0 fill-danger-600 text-white" />
              <div>
                <p className="text-sm text-ink">Valor em aberto</p>
                <p className="text-2xl font-bold text-danger-600">
                  <span className="text-xl font-medium">R$</span>{" "}
                  {formatMoeda(d.valorAberto).replace("R$", "").trim()}
                </p>
                <p className="text-xs text-danger-600">
                  {emAtraso ? "Vencido em" : "Vencimento"}: {formatData(d.proximoVencimento)}
                  {d.qtdAbertas > 1 && ` · ${d.qtdAbertas} cobranças`}
                </p>
              </div>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-4 rounded-xl border border-brand-500/15 bg-brand-50 px-4 py-3.5">
            <PartyPopper className="size-9 shrink-0 text-brand-600" />
            <div>
              <p className="text-sm text-ink">Valor em aberto</p>
              <p className="text-xl font-bold text-brand-700">Nenhuma cobrança pendente</p>
            </div>
          </div>
        )}

        <div
          className={cn(
            "flex items-center gap-4 rounded-xl border px-4 py-3",
            emAtraso ? "border-danger-600/15 bg-danger-50" : "border-brand-500/10 bg-brand-50",
          )}
        >
          {emAtraso ? (
            <CircleAlert className="size-10 shrink-0 fill-danger-600 text-white" />
          ) : (
            <CircleCheck className="size-10 shrink-0 fill-brand-500 text-white" />
          )}
          <div>
            <p className="text-sm text-ink">Situação</p>
            <p className={cn("text-xl font-bold", emAtraso ? "text-danger-600" : "text-brand-600")}>{d.situacao}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/pagamentos", label: "Pagamentos", icon: Files },
            { href: "/boletos", label: "Boletos", icon: FileText },
            { href: "/cotacao", label: "Cotação do Arroz", icon: Wheat },
            { href: "/avisos", label: "Avisos", icon: Megaphone },
          ].map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <AppCard className="flex h-24 flex-col items-center justify-center gap-2 transition hover:bg-brand-50">
                <Icon className="size-8 text-brand-700" strokeWidth={2.2} />
                <span className="text-sm font-medium text-ink">{label}</span>
              </AppCard>
            </Link>
          ))}
        </div>
      </Page>
    </>
  );
}
