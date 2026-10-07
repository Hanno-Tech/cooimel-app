import { BellOff, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { dataAviso } from "@/components/app/aviso-data";
import { AvisoIcon } from "@/components/app/aviso-icon";
import { AppHeader } from "@/components/app/shell";
import { AppCard, EmptyState, Page } from "@/components/app/ui";
import { requireAssociado } from "@/lib/auth/session";
import { listarAvisos } from "@/lib/services/app";

export const metadata: Metadata = { title: "Avisos" };

// Tela 9 — Avisos
export default async function AvisosPage() {
  const { associado } = await requireAssociado();
  const avisos = await listarAvisos(associado.id);

  return (
    <>
      <AppHeader title="Avisos" back="/inicio" />
      <Page>
        {avisos.length === 0 ? (
          <EmptyState icon={<BellOff className="size-10" />} title="Nenhum aviso no momento" />
        ) : (
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
            {avisos.map((a) => (
              <Link key={a.id} href={`/avisos/${a.id}`}>
                <AppCard className="relative flex items-center gap-3 px-4 py-4 transition hover:bg-gray-50 lg:h-full">
                  <AvisoIcon tipo={a.tipo} className="self-start" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-ink">{a.titulo}</p>
                    <p className="text-sm text-ink">{dataAviso(a.dataEvento, a.publicadoEm)}</p>
                    {a.local && <p className="text-xs text-ink-muted">Local: {a.local}</p>}
                    <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-ink-muted">{a.resumo}</p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-ink" />
                  {!a.lidoEm && (
                    <span
                      className="absolute top-3 right-3 size-2.5 rounded-full bg-danger-600"
                      aria-label="Não lido"
                    />
                  )}
                </AppCard>
              </Link>
            ))}
          </div>
        )}
      </Page>
    </>
  );
}
