import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CobrancaAcoes } from "@/components/admin/cobranca-acoes";
import { FotoAssociado } from "@/components/admin/foto-associado";
import { Panel } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { statusVisual } from "@/lib/domain/cobranca";
import {
  formatCompetencia,
  formatData,
  formatDataHora,
  formatHa,
  formatMoeda,
  hojeISO,
} from "@/lib/format";
import { bpParaInput, centavosParaInput } from "@/lib/parse";
import { encargosAtuais } from "@/lib/services/pagamentos";

function Linha({ k, v, forte }: { k: string; v: React.ReactNode; forte?: boolean }) {
  return (
    <div className={`flex justify-between py-2 text-sm ${forte ? "font-bold text-brand-900" : ""}`}>
      <span className={forte ? "" : "text-ink-muted"}>{k}</span>
      <span className="tabular-nums">{v}</span>
    </div>
  );
}

export default async function CobrancaPage({ params }: PageProps<"/admin/cobrancas/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const c = await db.query.cobranca.findFirst({
    where: eq(schema.cobranca.id, id),
    with: {
      associado: true,
      propriedade: true,
      instrumentos: { orderBy: [desc(schema.instrumento.createdAt)] },
      pagamentos: true,
    },
  });
  if (!c) notFound();
  const hoje = hojeISO();
  const enc = encargosAtuais(c);
  const st = statusVisual(c, hoje);

  return (
    <>
      <Link href="/admin/cobrancas" className="text-sm text-ink-muted hover:text-ink">
        ← Cobranças
      </Link>
      <div className="mt-3 mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-brand-900">
            {c.descricao} · {formatCompetencia(c.competencia)} <StatusBadge status={st} />
          </h1>
          <p className="text-sm text-ink-muted">Vencimento {formatData(c.vencimento)}</p>
        </div>
        {c.status === "aberta" && (
          <CobrancaAcoes id={c.id} valorSugerido={centavosParaInput(enc.total)} hoje={hoje} />
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Panel className="p-5">
          <h2 className="mb-3 font-semibold text-brand-900">Associado</h2>
          <Link href={`/admin/associados/${c.associadoId}`} className="flex items-center gap-3 hover:text-brand-700">
            <FotoAssociado associadoId={c.associadoId} fotoKey={c.associado.fotoKey} className="size-12" />
            <div>
              <div className="font-medium">{c.associado.nome}</div>
              <div className="text-xs text-ink-muted">Matrícula {c.associado.matricula}</div>
            </div>
          </Link>
          <div className="mt-4 border-t pt-3">
            <Linha k="Propriedade" v={c.propriedade.nome} />
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="mb-1 font-semibold text-brand-900">Valores</h2>
          <div className="divide-y">
            <Linha k="Área irrigada" v={formatHa(c.areaIrrigadaHa)} />
            <Linha k="Valor por hectare" v={formatMoeda(c.valorHaCentavos)} />
            <Linha k="Valor principal" v={formatMoeda(c.valorPrincipalCentavos)} />
            <Linha k={`Multa (${bpParaInput(c.multaBp)}%)`} v={formatMoeda(enc.multa)} />
            <Linha k={`Juros (${bpParaInput(c.jurosMesBp)}% a.m.)`} v={formatMoeda(enc.juros)} />
            <Linha k={c.status === "aberta" ? "Total hoje" : "Total"} v={formatMoeda(enc.total)} forte />
          </div>
          {c.canceladaMotivo && <p className="mt-3 text-sm text-danger-600">Cancelada: {c.canceladaMotivo}</p>}
        </Panel>

        <Panel className="p-5">
          <h2 className="mb-3 font-semibold text-brand-900">Pagamentos</h2>
          {c.pagamentos.length === 0 ? (
            <p className="text-sm text-ink-muted">Nenhum pagamento registrado.</p>
          ) : (
            c.pagamentos.map((p) => (
              <div key={p.id} className="mb-2 rounded-lg bg-brand-50 p-3 text-sm">
                <div className="font-medium text-brand-700">
                  {formatMoeda(p.valorPagoCentavos)} via {p.forma === "manual" ? "baixa manual" : p.forma.toUpperCase()}
                </div>
                <div className="text-xs text-ink-muted">{formatDataHora(p.pagoEm)}</div>
                {p.observacao && <div className="mt-1 text-xs">{p.observacao}</div>}
              </div>
            ))
          )}
          <h3 className="mt-4 mb-2 text-sm font-semibold text-brand-900">Boletos / Pix emitidos</h3>
          {c.instrumentos.length === 0 ? (
            <p className="text-sm text-ink-muted">O associado ainda não gerou boleto ou Pix.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {c.instrumentos.map((i) => (
                <li key={i.id} className="flex justify-between">
                  <span>
                    {i.tipo === "boleto" ? "Boleto" : "Pix"} · {formatMoeda(i.valorCentavos)}
                  </span>
                  <span className="text-ink-muted">{i.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
