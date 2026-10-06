import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { simularPagamento } from "@/app/actions/admin/cobrancas";
import { PageHeader, Panel, Vazio } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { formatCompetencia, formatDataHora, formatMoeda } from "@/lib/format";
import { ehMock } from "@/lib/payments";

export const metadata = { title: "Simulador do banco" };

export default async function SimuladorPage() {
  await requireAdmin();
  if (!ehMock()) notFound();

  const ativos = await db
    .select({
      id: schema.instrumento.id,
      tipo: schema.instrumento.tipo,
      valor: schema.instrumento.valorCentavos,
      criadoEm: schema.instrumento.createdAt,
      competencia: schema.cobranca.competencia,
      associado: schema.associado.nome,
    })
    .from(schema.instrumento)
    .innerJoin(schema.cobranca, eq(schema.cobranca.id, schema.instrumento.cobrancaId))
    .innerJoin(schema.associado, eq(schema.associado.id, schema.cobranca.associadoId))
    .where(and(eq(schema.instrumento.status, "ativo"), eq(schema.instrumento.provider, "mock")))
    .orderBy(desc(schema.instrumento.createdAt));

  return (
    <>
      <PageHeader
        titulo="Simulador do banco"
        descricao="Ambiente de teste: simula a Cresol confirmando o pagamento de boletos e Pix gerados pelos associados."
      />
      <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Este menu só existe enquanto <code>PAYMENT_PROVIDER=mock</code>. A confirmação passa pelo mesmo fluxo do
        webhook real (assinatura, idempotência, baixa da cobrança).
      </div>
      <Panel>
        {ativos.length === 0 ? (
          <Vazio>Nenhum boleto ou Pix ativo. Gere um pelo app do associado.</Vazio>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Gerado em</TableHead>
                <TableHead>Associado</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ativos.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="pl-5">{formatDataHora(i.criadoEm)}</TableCell>
                  <TableCell>{i.associado}</TableCell>
                  <TableCell>{formatCompetencia(i.competencia)}</TableCell>
                  <TableCell>{i.tipo === "boleto" ? "Boleto" : "Pix"}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoeda(i.valor)}</TableCell>
                  <TableCell className="pr-5 text-right">
                    <form action={simularPagamento}>
                      <input type="hidden" name="instrumentoId" value={i.id} />
                      <Button size="sm">Simular pagamento</Button>
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
