import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Acesso } from "@/components/admin/acesso";
import { AssociadoForm } from "@/components/admin/associado-form";
import { FotoAssociado, fotoUrl } from "@/components/admin/foto-associado";
import { Panel, Vazio } from "@/components/admin/page-header";
import { Propriedades } from "@/components/admin/propriedades";
import { StatusBadge } from "@/components/admin/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { statusVisual } from "@/lib/domain/cobranca";
import { formatCompetencia, formatCpf, formatData, formatDataHora, formatMoeda, hojeISO } from "@/lib/format";
import { cn } from "@/lib/utils";

const abas = [
  ["dados", "Dados pessoais"],
  ["propriedades", "Propriedades"],
  ["acesso", "Acesso ao app"],
  ["cobrancas", "Cobranças"],
] as const;

export default async function AssociadoPage({ params, searchParams }: PageProps<"/admin/associados/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const tab = abas.some(([k]) => k === sp.tab) ? String(sp.tab) : "dados";

  const a = await db.query.associado.findFirst({
    where: eq(schema.associado.id, id),
    with: {
      usuario: true,
      propriedades: { orderBy: (p, { asc }) => [asc(p.nome)] },
    },
  });
  if (!a) notFound();

  const cobrancas =
    tab === "cobrancas"
      ? await db.query.cobranca.findMany({
          where: eq(schema.cobranca.associadoId, id),
          with: { propriedade: { columns: { nome: true } } },
          orderBy: [desc(schema.cobranca.vencimento)],
        })
      : [];
  const hoje = hojeISO();

  return (
    <>
      <Link href="/admin/associados" className="text-sm text-ink-muted hover:text-ink">
        ← Associados
      </Link>
      <div className="mt-3 mb-6 flex items-center gap-4">
        <FotoAssociado associadoId={a.id} fotoKey={a.fotoKey} className="size-16" />
        <div>
          <h1 className="text-2xl font-bold text-brand-900">{a.nome}</h1>
          <p className="text-sm text-ink-muted">
            Matrícula {a.matricula} · CPF {formatCpf(a.cpf)}
          </p>
        </div>
      </div>

      <div className="mb-4 flex gap-1 border-b">
        {abas.map(([k, l]) => (
          <Link
            key={k}
            href={`?tab=${k}`}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium",
              tab === k ? "border-brand-600 text-brand-700" : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {l}
            {k === "propriedades" && <span className="ml-1.5 text-xs text-ink-muted">({a.propriedades.length})</span>}
          </Link>
        ))}
      </div>

      <Panel className={tab === "dados" ? "p-8" : ""}>
        {tab === "dados" && <AssociadoForm associado={a} fotoUrl={fotoUrl(a.id, a.fotoKey)} />}
        {tab === "propriedades" && <Propriedades associadoId={a.id} props={a.propriedades} />}
        {tab === "acesso" && (
          <Acesso
            associadoId={a.id}
            nome={a.nome}
            ativo={a.usuario.ativo}
            deveTrocarSenha={a.usuario.deveTrocarSenha}
            ultimoLogin={a.usuario.ultimoLoginEm ? formatDataHora(a.usuario.ultimoLoginEm) : null}
            bloqueadoAte={
              a.usuario.bloqueadoAte && a.usuario.bloqueadoAte > new Date()
                ? formatDataHora(a.usuario.bloqueadoAte)
                : null
            }
          />
        )}
        {tab === "cobrancas" &&
          (cobrancas.length === 0 ? (
            <Vazio>Nenhuma cobrança para este associado.</Vazio>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Competência</TableHead>
                  <TableHead>Propriedade</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="pr-5">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cobrancas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="pl-5">
                      <Link href={`/admin/cobrancas/${c.id}`} className="font-medium hover:text-brand-700">
                        {formatCompetencia(c.competencia)}
                      </Link>
                    </TableCell>
                    <TableCell>{c.propriedade.nome}</TableCell>
                    <TableCell>{formatData(c.vencimento)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoeda(c.valorPrincipalCentavos)}</TableCell>
                    <TableCell className="pr-5">
                      <StatusBadge status={statusVisual(c, hoje)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ))}
      </Panel>
    </>
  );
}
