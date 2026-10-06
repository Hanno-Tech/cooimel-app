import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { FotoAssociado } from "@/components/admin/foto-associado";
import { PageHeader, Panel, Vazio } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { formatCpf, formatHa, formatTelefone, somenteDigitos } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Associados" };

const situacoes = { ativo: "Ativo", suspenso: "Suspenso", inativo: "Inativo" } as const;

export default async function AssociadosPage({ searchParams }: PageProps<"/admin/associados">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const situacao = String(sp.situacao ?? "");
  const a = schema.associado;

  const filtros = [];
  if (q) {
    const d = somenteDigitos(q);
    filtros.push(
      or(ilike(a.nome, `%${q}%`), eq(a.matricula, q), ...(d.length >= 3 ? [ilike(a.cpf, `%${d}%`)] : [])),
    );
  }
  if (situacao in situacoes) filtros.push(eq(a.situacao, situacao as keyof typeof situacoes));

  const lista = await db
    .select({
      id: a.id,
      nome: a.nome,
      cpf: a.cpf,
      matricula: a.matricula,
      telefone: a.telefone,
      fotoKey: a.fotoKey,
      situacao: a.situacao,
      propriedades: sql<number>`count(${schema.propriedade.id}) filter (where ${schema.propriedade.ativa})`.mapWith(Number),
      areaIrrigada: sql<string>`coalesce(sum(${schema.propriedade.areaIrrigadaHa}) filter (where ${schema.propriedade.ativa}), 0)`,
    })
    .from(a)
    .leftJoin(schema.propriedade, eq(schema.propriedade.associadoId, a.id))
    .where(filtros.length ? and(...filtros) : undefined)
    .groupBy(a.id)
    .orderBy(asc(a.nome))
    .limit(200);

  return (
    <>
      <PageHeader titulo="Associados" descricao={`${lista.length} associado(s)`}>
        <Button asChild size="lg">
          <Link href="/admin/associados/novo">
            <Plus /> Novo associado
          </Link>
        </Button>
      </PageHeader>

      <form className="mb-4 flex gap-2">
        <div className="relative w-96">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome, CPF ou matrícula"
            className="h-9 w-full rounded-lg border border-input bg-white pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <select
          name="situacao"
          defaultValue={situacao}
          className="h-9 rounded-lg border border-input bg-white px-2.5 text-sm"
        >
          <option value="">Todas as situações</option>
          {Object.entries(situacoes).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="lg">
          Filtrar
        </Button>
      </form>

      <Panel>
        {lista.length === 0 ? (
          <Vazio>
            {q || situacao ? "Nenhum associado encontrado." : "Nenhum associado cadastrado ainda."}
          </Vazio>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Associado</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="text-right">Propriedades</TableHead>
                <TableHead className="text-right">Área irrigada</TableHead>
                <TableHead className="pr-5">Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((r) => (
                <TableRow key={r.id} className="cursor-pointer">
                  <TableCell className="pl-5">
                    <Link href={`/admin/associados/${r.id}`} className="flex items-center gap-3 font-medium text-ink hover:text-brand-700">
                      <FotoAssociado associadoId={r.id} fotoKey={r.fotoKey} />
                      {r.nome}
                    </Link>
                  </TableCell>
                  <TableCell>{r.matricula}</TableCell>
                  <TableCell className="tabular-nums">{formatCpf(r.cpf)}</TableCell>
                  <TableCell>{formatTelefone(r.telefone)}</TableCell>
                  <TableCell className="text-right">{r.propriedades}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatHa(r.areaIrrigada)}</TableCell>
                  <TableCell className="pr-5">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        r.situacao === "ativo" && "bg-brand-50 text-brand-700",
                        r.situacao === "suspenso" && "bg-amber-50 text-amber-700",
                        r.situacao === "inativo" && "bg-gray-100 text-gray-500",
                      )}
                    >
                      {situacoes[r.situacao]}
                    </span>
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
