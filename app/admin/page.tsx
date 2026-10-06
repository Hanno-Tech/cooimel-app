import { and, count, desc, eq, gte, lt, sql, sum } from "drizzle-orm";
import { AlertTriangle, Banknote, Clock, Users } from "lucide-react";
import Link from "next/link";
import { PageHeader, Panel, Vazio } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { formatDataHora, formatMoeda, hojeISO } from "@/lib/format";

export const metadata = { title: "Painel" };

function Kpi({ icon: Icon, label, valor, sub, cor }: { icon: typeof Users; label: string; valor: string; sub?: string; cor: string }) {
  return (
    <Panel className="flex items-start gap-4 p-5">
      <span className={`flex size-11 items-center justify-center rounded-xl ${cor}`}>
        <Icon className="size-5" />
      </span>
      <div>
        <div className="text-sm text-ink-muted">{label}</div>
        <div className="text-2xl font-bold text-ink tabular-nums">{valor}</div>
        {sub && <div className="text-xs text-ink-muted">{sub}</div>}
      </div>
    </Panel>
  );
}

export default async function AdminHome() {
  const u = await requireAdmin();
  const hoje = hojeISO();
  const inicioMes = new Date(`${hoje.slice(0, 7)}-01T00:00:00-03:00`);
  const c = schema.cobranca;

  const [[assoc], [aVencer], [vencidas], [recebido], ultimos] = await Promise.all([
    db.select({ n: count() }).from(schema.associado).where(eq(schema.associado.situacao, "ativo")),
    db
      .select({ n: count(), v: sum(c.valorPrincipalCentavos).mapWith(Number) })
      .from(c)
      .where(and(eq(c.status, "aberta"), gte(c.vencimento, hoje))),
    db
      .select({ n: count(), v: sum(c.valorPrincipalCentavos).mapWith(Number), a: sql<number>`count(distinct ${c.associadoId})`.mapWith(Number) })
      .from(c)
      .where(and(eq(c.status, "aberta"), lt(c.vencimento, hoje))),
    db
      .select({ n: count(), v: sum(schema.pagamento.valorPagoCentavos).mapWith(Number) })
      .from(schema.pagamento)
      .where(gte(schema.pagamento.pagoEm, inicioMes)),
    db
      .select({
        id: schema.pagamento.id,
        cobrancaId: schema.pagamento.cobrancaId,
        valor: schema.pagamento.valorPagoCentavos,
        forma: schema.pagamento.forma,
        pagoEm: schema.pagamento.pagoEm,
        nome: schema.associado.nome,
      })
      .from(schema.pagamento)
      .innerJoin(c, eq(c.id, schema.pagamento.cobrancaId))
      .innerJoin(schema.associado, eq(schema.associado.id, c.associadoId))
      .orderBy(desc(schema.pagamento.pagoEm))
      .limit(8),
  ]);

  return (
    <>
      <PageHeader titulo={`Olá, ${u.nome.split(" ")[0]}`} descricao="Resumo da cooperativa" />
      <div className="mb-6 grid grid-cols-4 gap-4">
        <Kpi icon={Users} label="Associados ativos" valor={String(assoc.n)} cor="bg-brand-50 text-brand-700" />
        <Kpi icon={Clock} label="A vencer" valor={formatMoeda(aVencer.v ?? 0)} sub={`${aVencer.n} cobrança(s)`} cor="bg-amber-50 text-warning-500" />
        <Kpi
          icon={AlertTriangle}
          label="Vencido"
          valor={formatMoeda(vencidas.v ?? 0)}
          sub={`${vencidas.n} cobrança(s) · ${vencidas.a} associado(s)`}
          cor="bg-danger-50 text-danger-600"
        />
        <Kpi icon={Banknote} label="Recebido no mês" valor={formatMoeda(recebido.v ?? 0)} sub={`${recebido.n} pagamento(s)`} cor="bg-brand-50 text-brand-700" />
      </div>

      <Panel>
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="font-semibold text-brand-900">Últimos pagamentos</h2>
          <Link href="/admin/pagamentos" className="text-sm text-brand-700 hover:underline">
            Ver todos
          </Link>
        </div>
        {ultimos.length === 0 ? (
          <Vazio>Nenhum pagamento ainda.</Vazio>
        ) : (
          <ul className="divide-y">
            {ultimos.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <Link href={`/admin/cobrancas/${p.cobrancaId}`} className="font-medium hover:text-brand-700">
                  {p.nome}
                </Link>
                <span className="text-ink-muted">
                  {formatDataHora(p.pagoEm)} · {p.forma === "manual" ? "Manual" : p.forma.toUpperCase()}
                </span>
                <span className="font-medium tabular-nums">{formatMoeda(p.valor)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
