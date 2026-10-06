import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { PageHeader, Panel, Vazio } from "@/components/admin/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { formatCompetencia, formatDataHora, formatMoeda } from "@/lib/format";

export const metadata = { title: "Pagamentos" };

const formas = { boleto: "Boleto", pix: "Pix", manual: "Baixa manual" } as const;

export default async function PagamentosPage() {
  await requireAdmin();
  const lista = await db
    .select({
      id: schema.pagamento.id,
      cobrancaId: schema.pagamento.cobrancaId,
      forma: schema.pagamento.forma,
      valor: schema.pagamento.valorPagoCentavos,
      pagoEm: schema.pagamento.pagoEm,
      competencia: schema.cobranca.competencia,
      associado: schema.associado.nome,
      matricula: schema.associado.matricula,
    })
    .from(schema.pagamento)
    .innerJoin(schema.cobranca, eq(schema.cobranca.id, schema.pagamento.cobrancaId))
    .innerJoin(schema.associado, eq(schema.associado.id, schema.cobranca.associadoId))
    .orderBy(desc(schema.pagamento.pagoEm))
    .limit(300);

  const total = lista.reduce((s, p) => s + p.valor, 0);

  return (
    <>
      <PageHeader titulo="Pagamentos" descricao={`${lista.length} pagamento(s) · ${formatMoeda(total)}`} />
      <Panel>
        {lista.length === 0 ? (
          <Vazio>Nenhum pagamento recebido ainda.</Vazio>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Data</TableHead>
                <TableHead>Associado</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead className="pr-5 text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="pl-5">{formatDataHora(p.pagoEm)}</TableCell>
                  <TableCell>
                    <Link href={`/admin/cobrancas/${p.cobrancaId}`} className="font-medium hover:text-brand-700">
                      {p.associado}
                    </Link>{" "}
                    <span className="text-xs text-ink-muted">({p.matricula})</span>
                  </TableCell>
                  <TableCell>{formatCompetencia(p.competencia)}</TableCell>
                  <TableCell>{formas[p.forma]}</TableCell>
                  <TableCell className="pr-5 text-right font-medium tabular-nums">{formatMoeda(p.valor)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  );
}
