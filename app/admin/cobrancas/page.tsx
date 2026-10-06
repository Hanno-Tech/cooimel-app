import { and, desc, eq, gte, lt, ne, type SQL } from "drizzle-orm";
import { Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader, Panel, Vazio } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { statusVisual } from "@/lib/domain/cobranca";
import { formatCompetencia, formatData, formatHa, formatMoeda, hojeISO } from "@/lib/format";

export const metadata = { title: "Cobranças" };

const filtrosStatus = [
  ["", "Todas"],
  ["aberta", "Em aberto"],
  ["vencida", "Vencidas"],
  ["paga", "Pagas"],
  ["cancelada", "Canceladas"],
] as const;

export default async function CobrancasPage({ searchParams }: PageProps<"/admin/cobrancas">) {
  await requireAdmin();
  const sp = await searchParams;
  const competencia = String(sp.competencia ?? "");
  const status = String(sp.status ?? "");
  const gerado = sp.gerado ? Number(sp.gerado) : null;
  const hoje = hojeISO();
  const c = schema.cobranca;

  const where: SQL[] = [];
  if (/^\d{4}-\d{2}$/.test(competencia)) where.push(eq(c.competencia, competencia));
  if (status === "aberta") where.push(eq(c.status, "aberta"), gte(c.vencimento, hoje));
  if (status === "vencida") where.push(eq(c.status, "aberta"), lt(c.vencimento, hoje));
  if (status === "paga") where.push(eq(c.status, "paga"));
  if (status === "cancelada") where.push(eq(c.status, "cancelada"));

  const [lista, competencias] = await Promise.all([
    db.query.cobranca.findMany({
      where: where.length ? and(...where) : undefined,
      with: {
        associado: { columns: { nome: true, matricula: true } },
        propriedade: { columns: { nome: true } },
      },
      orderBy: [desc(c.vencimento)],
      limit: 300,
    }),
    db
      .selectDistinct({ competencia: c.competencia })
      .from(c)
      .where(ne(c.status, "cancelada"))
      .orderBy(desc(c.competencia)),
  ]);

  const total = lista.filter((x) => x.status !== "cancelada").reduce((s, x) => s + x.valorPrincipalCentavos, 0);
  const qs = (o: Record<string, string>) => {
    const p = new URLSearchParams({ ...(competencia && { competencia }), ...(status && { status }), ...o });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `?${p}`;
  };

  return (
    <>
      <PageHeader titulo="Cobranças" descricao="Taxas de irrigação emitidas por propriedade.">
        <Button asChild size="lg">
          <Link href="/admin/cobrancas/gerar">
            <Plus /> Gerar cobranças
          </Link>
        </Button>
      </PageHeader>

      {gerado !== null && (
        <div className="mb-4 rounded-lg border border-brand-500/30 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          {gerado} cobrança(s) gerada(s) com sucesso.
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <div className="flex rounded-lg border bg-white p-0.5">
          {filtrosStatus.map(([v, l]) => (
            <Link
              key={v}
              href={qs({ status: v })}
              className={`rounded-md px-3 py-1.5 text-sm ${status === v ? "bg-brand-600 font-medium text-white" : "text-ink-muted hover:text-ink"}`}
            >
              {l}
            </Link>
          ))}
        </div>
        <form className="flex items-center gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <select name="competencia" defaultValue={competencia} className="h-9 rounded-lg border bg-white px-2.5 text-sm">
            <option value="">Todas as competências</option>
            {competencias.map((x) => (
              <option key={x.competencia} value={x.competencia}>
                {formatCompetencia(x.competencia)}
              </option>
            ))}
          </select>
          <Button variant="outline" size="lg">
            Filtrar
          </Button>
        </form>
        <div className="ml-auto text-sm text-ink-muted">
          {lista.length} cobrança(s) · <strong className="text-ink">{formatMoeda(total)}</strong>
        </div>
      </div>

      <Panel>
        {lista.length === 0 ? (
          <Vazio>Nenhuma cobrança encontrada.</Vazio>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Associado</TableHead>
                <TableHead>Propriedade</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Área irrigada</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="pr-5">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((x) => (
                <TableRow key={x.id}>
                  <TableCell className="pl-5">
                    <Link href={`/admin/cobrancas/${x.id}`} className="font-medium hover:text-brand-700">
                      {x.associado.nome}
                    </Link>
                    <div className="text-xs text-ink-muted">Matrícula {x.associado.matricula}</div>
                  </TableCell>
                  <TableCell>{x.propriedade.nome}</TableCell>
                  <TableCell>{formatCompetencia(x.competencia)}</TableCell>
                  <TableCell>{formatData(x.vencimento)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatHa(x.areaIrrigadaHa)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatMoeda(x.valorPrincipalCentavos)}</TableCell>
                  <TableCell className="pr-5">
                    <StatusBadge status={statusVisual(x, hoje)} />
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

