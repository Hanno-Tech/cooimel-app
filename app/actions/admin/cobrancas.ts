"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { registrarAuditoria } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { valorPrincipal } from "@/lib/domain/cobranca";
import { getGateway } from "@/lib/payments";
import { parseMoeda } from "@/lib/parse";
import { obterConfiguracao } from "@/lib/services/cobrancas-admin";
import { simularPagamentoMock } from "@/lib/services/pagamentos";

export type Estado = { ok?: boolean; erro?: string } | undefined;

const COMPETENCIA = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

export async function gerarLote(_: Estado, fd: FormData): Promise<Estado> {
  const admin = await requireAdmin();
  const competencia = String(fd.get("competencia") ?? "");
  const vencimento = String(fd.get("vencimento") ?? "");
  const valorHa = parseMoeda(fd.get("valorHa"));
  const ids = fd.getAll("propriedadeId").map(String);
  const descricao = String(fd.get("descricao") ?? "").trim() || "Taxa de irrigação";

  if (!COMPETENCIA.test(competencia)) return { erro: "Competência inválida" };
  if (!DATA.test(vencimento)) return { erro: "Vencimento inválido" };
  if (!valorHa) return { erro: "Informe o valor por hectare" };
  if (ids.length === 0) return { erro: "Selecione ao menos uma propriedade" };

  const cfg = await obterConfiguracao();
  const props = await db
    .select({
      id: schema.propriedade.id,
      associadoId: schema.propriedade.associadoId,
      area: schema.propriedade.areaIrrigadaHa,
    })
    .from(schema.propriedade)
    .innerJoin(schema.associado, eq(schema.associado.id, schema.propriedade.associadoId))
    .where(
      and(
        inArray(schema.propriedade.id, ids),
        eq(schema.propriedade.ativa, true),
        eq(schema.associado.situacao, "ativo"),
      ),
    );

  const existentes = await db
    .select({ p: schema.cobranca.propriedadeId })
    .from(schema.cobranca)
    .where(
      and(
        eq(schema.cobranca.competencia, competencia),
        ne(schema.cobranca.status, "cancelada"),
        inArray(schema.cobranca.propriedadeId, ids),
      ),
    );
  const ja = new Set(existentes.map((e) => e.p));
  const novas = props.filter((p) => !ja.has(p.id) && Number(p.area) > 0);
  if (novas.length === 0) return { erro: "Todas as propriedades selecionadas já têm cobrança nesta competência" };

  const loteId = await db.transaction(async (tx) => {
    const [lote] = await tx
      .insert(schema.loteCobranca)
      .values({ competencia, vencimento, valorHaCentavos: valorHa, geradoPor: admin.id })
      .returning({ id: schema.loteCobranca.id });
    await tx.insert(schema.cobranca).values(
      novas.map((p) => ({
        loteId: lote.id,
        associadoId: p.associadoId,
        propriedadeId: p.id,
        descricao,
        competencia,
        vencimento,
        areaIrrigadaHa: p.area,
        valorHaCentavos: valorHa,
        valorPrincipalCentavos: valorPrincipal(p.area, valorHa),
        multaBp: cfg.multaBp,
        jurosMesBp: cfg.jurosMesBp,
        jurosProRata: cfg.jurosProRata,
      })),
    );
    return lote.id;
  });

  await registrarAuditoria(admin.id, "gerar_lote", "lote_cobranca", loteId, {
    competencia,
    vencimento,
    quantidade: novas.length,
  });
  revalidatePath("/admin/cobrancas");
  redirect(`/admin/cobrancas?competencia=${competencia}&gerado=${novas.length}`);
}

async function invalidarInstrumentos(cobrancaId: string) {
  const ativos = await db.query.instrumento.findMany({
    where: and(eq(schema.instrumento.cobrancaId, cobrancaId), eq(schema.instrumento.status, "ativo")),
  });
  for (const i of ativos) {
    await getGateway(i.provider).cancelar(i.providerRef).catch(() => {});
  }
  await db
    .update(schema.instrumento)
    .set({ status: "cancelado" })
    .where(and(eq(schema.instrumento.cobrancaId, cobrancaId), eq(schema.instrumento.status, "ativo")));
}

export async function cancelarCobranca(_: Estado, fd: FormData): Promise<Estado> {
  const admin = await requireAdmin();
  const id = String(fd.get("id"));
  const motivo = String(fd.get("motivo") ?? "").trim();
  if (motivo.length < 3) return { erro: "Informe o motivo do cancelamento" };
  const c = await db.query.cobranca.findFirst({ where: eq(schema.cobranca.id, id) });
  if (!c || c.status !== "aberta") return { erro: "Somente cobranças em aberto podem ser canceladas" };

  await invalidarInstrumentos(id);
  await db.update(schema.cobranca).set({ status: "cancelada", canceladaMotivo: motivo }).where(eq(schema.cobranca.id, id));
  await registrarAuditoria(admin.id, "cancelar", "cobranca", id, { motivo });
  revalidatePath(`/admin/cobrancas/${id}`);
  return { ok: true };
}

export async function baixaManual(_: Estado, fd: FormData): Promise<Estado> {
  const admin = await requireAdmin();
  const id = String(fd.get("id"));
  const valor = parseMoeda(fd.get("valor"));
  const data = String(fd.get("data") ?? "");
  const observacao = String(fd.get("observacao") ?? "").trim();
  if (!valor) return { erro: "Informe o valor recebido" };
  if (!DATA.test(data)) return { erro: "Informe a data do pagamento" };
  if (observacao.length < 3) return { erro: "Descreva como foi recebido (ex.: dinheiro no caixa)" };

  const c = await db.query.cobranca.findFirst({ where: eq(schema.cobranca.id, id) });
  if (!c || c.status !== "aberta") return { erro: "Cobrança não está em aberto" };

  await invalidarInstrumentos(id);
  const principal = Math.min(valor, c.valorPrincipalCentavos);
  await db.transaction(async (tx) => {
    await tx.insert(schema.pagamento).values({
      cobrancaId: id,
      forma: "manual",
      valorPagoCentavos: valor,
      principalCentavos: principal,
      jurosCentavos: valor - principal,
      pagoEm: new Date(`${data}T12:00:00-03:00`),
      baixadoPor: admin.id,
      observacao,
    });
    await tx.update(schema.cobranca).set({ status: "paga" }).where(eq(schema.cobranca.id, id));
  });
  await registrarAuditoria(admin.id, "baixa_manual", "cobranca", id, { valor, data, observacao });
  revalidatePath(`/admin/cobrancas/${id}`);
  return { ok: true };
}

export async function simularPagamento(fd: FormData) {
  await requireAdmin();
  await simularPagamentoMock(String(fd.get("instrumentoId")));
  revalidatePath("/admin/simulador-banco");
  revalidatePath("/admin/cobrancas");
}
