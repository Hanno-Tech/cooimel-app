import { CalendarDays, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { dataAviso } from "@/components/app/aviso-data";
import { AvisoIcon } from "@/components/app/aviso-icon";
import { AppHeader } from "@/components/app/shell";
import { AppCard, Page } from "@/components/app/ui";
import { requireAssociado } from "@/lib/auth/session";
import { formatDataHora } from "@/lib/format";
import { marcarAvisoLido, obterAviso } from "@/lib/services/app";

export const metadata: Metadata = { title: "Aviso" };

export default async function AvisoPage({ params }: PageProps<"/avisos/[id]">) {
  const { id } = await params;
  const { associado } = await requireAssociado();
  const a = await obterAviso(id);
  await marcarAvisoLido(associado.id, a.id);

  return (
    <>
      <AppHeader title="Aviso" back="/avisos" />
      <Page largura="estreita">
        <AppCard className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <AvisoIcon tipo={a.tipo} className="size-12" />
            <h2 className="text-lg font-medium text-ink">{a.titulo}</h2>
          </div>
          {(a.dataEvento || a.local) && (
            <div className="space-y-1.5 rounded-lg bg-brand-50 p-3 text-sm text-ink">
              {a.dataEvento && (
                <p className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-brand-700" /> {dataAviso(a.dataEvento, null)}
                </p>
              )}
              {a.local && (
                <p className="flex items-center gap-2">
                  <MapPin className="size-4 text-brand-700" /> {a.local}
                </p>
              )}
            </div>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-line text-ink">{a.corpo || a.resumo}</p>
          {a.publicadoEm && (
            <p className="text-xs text-ink-muted">Publicado em {formatDataHora(a.publicadoEm)}</p>
          )}
        </AppCard>
      </Page>
    </>
  );
}
