import { desc } from "drizzle-orm";
import { Trash2 } from "lucide-react";
import { removerAviso } from "@/app/actions/admin/geral";
import { AvisoDialog } from "@/components/admin/aviso-dialog";
import { PageHeader, Panel, Vazio } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { formatDataHora } from "@/lib/format";

export const metadata = { title: "Avisos" };

const tipos = {
  manutencao: ["Manutenção", "bg-danger-50 text-danger-600"],
  assembleia: ["Assembleia", "bg-brand-50 text-brand-700"],
  orientacao: ["Orientação", "bg-blue-50 text-info-500"],
} as const;

const paraInput = (d: Date | null) =>
  d ? d.toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).slice(0, 16).replace(" ", "T") : "";

export default async function AvisosPage() {
  await requireAdmin();
  const lista = await db.query.aviso.findMany({ orderBy: [desc(schema.aviso.createdAt)] });
  return (
    <>
      <PageHeader titulo="Avisos" descricao="Comunicados exibidos na tela Avisos do app.">
        <AvisoDialog />
      </PageHeader>
      <Panel>
        {lista.length === 0 ? (
          <Vazio>Nenhum aviso cadastrado.</Vazio>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Tipo</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="pl-5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tipos[a.tipo][1]}`}>{tipos[a.tipo][0]}</span>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="font-medium">{a.titulo}</div>
                    <div className="truncate text-xs text-ink-muted">{a.resumo}</div>
                  </TableCell>
                  <TableCell>{a.dataEvento ? formatDataHora(a.dataEvento) : "—"}</TableCell>
                  <TableCell>{a.publicadoEm ? "Publicado" : <span className="text-ink-muted">Rascunho</span>}</TableCell>
                  <TableCell className="pr-5 text-right whitespace-nowrap">
                    <AvisoDialog
                      aviso={{
                        id: a.id,
                        tipo: a.tipo,
                        titulo: a.titulo,
                        resumo: a.resumo,
                        corpo: a.corpo,
                        dataEvento: paraInput(a.dataEvento),
                        local: a.local,
                        publicado: !!a.publicadoEm,
                      }}
                    />
                    <form action={removerAviso} className="inline">
                      <input type="hidden" name="id" value={a.id} />
                      <Button variant="ghost" size="icon-sm" aria-label="Remover">
                        <Trash2 className="text-danger-600" />
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  );
}
