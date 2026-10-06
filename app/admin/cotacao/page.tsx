import { desc } from "drizzle-orm";
import { Trash2 } from "lucide-react";
import { lancarCotacao, removerCotacao } from "@/app/actions/admin/geral";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { Campo } from "@/components/admin/campo";
import { PageHeader, Panel, Vazio } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { formatDataHora, formatMoeda } from "@/lib/format";

export const metadata = { title: "Cotação do arroz" };

function agoraLocal() {
  return new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).slice(0, 16).replace(" ", "T");
}

export default async function CotacaoPage() {
  await requireAdmin();
  const lista = await db.query.cotacao.findMany({ orderBy: [desc(schema.cotacao.referenciaEm)], limit: 100 });
  const ultima = lista[0];

  return (
    <>
      <PageHeader titulo="Cotação do arroz" descricao="Valor exibido na tela Cotação do Arroz do app." />
      <div className="grid grid-cols-[380px_1fr] gap-6">
        <Panel className="h-fit p-6">
          <h2 className="mb-4 font-semibold text-brand-900">Lançar nova cotação</h2>
          <ActionForm action={lancarCotacao} sucesso="Cotação lançada" className="space-y-4">
            <Campo name="valor" label="Valor da saca (R$)" inputMode="decimal" placeholder="78,50" required />
            <Campo
              name="referenciaEm"
              label="Data/hora de referência"
              type="datetime-local"
              defaultValue={agoraLocal()}
            />
            <Campo name="produto" label="Produto" defaultValue={ultima?.produto ?? "Arroz em casca"} />
            <div className="grid grid-cols-2 gap-3">
              <Campo name="unidade" label="Unidade" defaultValue={ultima?.unidade ?? "Saca de 50 kg"} />
              <Campo name="regiao" label="Região" defaultValue={ultima?.regiao ?? "Santa Catarina"} />
            </div>
            <Campo name="fonte" label="Fonte" defaultValue={ultima?.fonte ?? "CEPA/SC"} />
            <SubmitButton className="w-full" size="lg">
              Lançar cotação
            </SubmitButton>
          </ActionForm>
        </Panel>

        <Panel>
          <div className="border-b px-5 py-3 font-semibold text-brand-900">Histórico</div>
          {lista.length === 0 ? (
            <Vazio>Nenhuma cotação lançada.</Vazio>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Referência</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Região / fonte</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="pr-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((c, i) => (
                  <TableRow key={c.id}>
                    <TableCell className="pl-5">
                      {formatDataHora(c.referenciaEm)}
                      {i === 0 && (
                        <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">atual</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.produto} <span className="text-xs text-ink-muted">({c.unidade})</span>
                    </TableCell>
                    <TableCell>
                      {c.regiao} · {c.fonte}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoeda(c.valorCentavos)}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <form action={removerCotacao}>
                        <input type="hidden" name="id" value={c.id} />
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
      </div>
    </>
  );
}
