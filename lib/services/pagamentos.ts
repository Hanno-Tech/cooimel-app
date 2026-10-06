import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { calcularEncargos } from "@/lib/domain/cobranca";
import { hojeISO } from "@/lib/format";
import { getGateway, provedorAtual } from "@/lib/payments";
import { assinarMock } from "@/lib/payments/mock";

type Cobranca = typeof schema.cobranca.$inferSelect;
type Instrumento = typeof schema.instrumento.$inferSelect;

export function encargosAtuais(c: Cobranca) {
  return calcularEncargos(
    {
      vencimento: c.vencimento,
      valorPrincipalCentavos: c.valorPrincipalCentavos,
      multaBp: c.multaBp,
      jurosMesBp: c.jurosMesBp,
      jurosProRata: c.jurosProRata,
      status: c.status,
    },
    hojeISO(),
  );
}

/**
 * Reaproveita o instrumento ativo se o valor ainda é o mesmo; senão cancela
 * o antigo e registra um novo no provedor (ex.: encargos mudaram após o vencimento).
 */
export async function obterOuCriarInstrumento(
  cobrancaId: string,
  tipo: "boleto" | "pix",
): Promise<Instrumento> {
  const cobranca = await db.query.cobranca.findFirst({
    where: eq(schema.cobranca.id, cobrancaId),
    with: { associado: true },
  });
  if (!cobranca) throw new Error("Cobrança não encontrada");
  if (cobranca.status !== "aberta") throw new Error("Cobrança não está em aberto");

  const { total } = encargosAtuais(cobranca);
  const provider = provedorAtual();
  const gateway = getGateway(provider);

  const ativos = await db.query.instrumento.findMany({
    where: and(
      eq(schema.instrumento.cobrancaId, cobrancaId),
      eq(schema.instrumento.tipo, tipo),
      eq(schema.instrumento.status, "ativo"),
    ),
  });
  const agora = new Date();
  const valido = ativos.find(
    (i) => i.valorCentavos === total && i.provider === provider && (!i.expiraEm || i.expiraEm > agora),
  );
  if (valido) return valido;

  for (const i of ativos) {
    await getGateway(i.provider).cancelar(i.providerRef).catch(() => {});
    await db
      .update(schema.instrumento)
      .set({ status: i.expiraEm && i.expiraEm <= agora ? "expirado" : "cancelado" })
      .where(eq(schema.instrumento.id, i.id));
  }

  const input = {
    cobrancaId,
    valorCentavos: total,
    vencimento: cobranca.vencimento < hojeISO() ? hojeISO() : cobranca.vencimento,
    pagador: { nome: cobranca.associado.nome, cpf: cobranca.associado.cpf },
    descricao: `${cobranca.descricao} ${cobranca.competencia}`,
  };

  if (tipo === "boleto") {
    const b = await gateway.criarBoleto(input);
    const [row] = await db
      .insert(schema.instrumento)
      .values({
        cobrancaId,
        tipo,
        provider,
        providerRef: b.providerRef,
        linhaDigitavel: b.linhaDigitavel,
        codigoBarras: b.codigoBarras,
        valorCentavos: total,
        expiraEm: b.expiraEm,
      })
      .returning();
    return row;
  }

  const p = await gateway.criarPix(input);
  const [row] = await db
    .insert(schema.instrumento)
    .values({
      cobrancaId,
      tipo,
      provider,
      providerRef: p.providerRef,
      pixCopiaCola: p.copiaCola,
      valorCentavos: total,
      expiraEm: p.expiraEm,
    })
    .returning();
  return row;
}

/** Processa um webhook de pagamento. Idempotente por eventId. */
export async function processarWebhook(provider: string, body: string, headers: Headers) {
  const [log] = await db
    .insert(schema.webhookEvento)
    .values({ provider, payload: safeJson(body) })
    .returning({ id: schema.webhookEvento.id });

  try {
    const evento = await getGateway(provider).parseWebhook(body, headers);
    const resultado = await db.transaction(async (tx) => {
      const ja = await tx.query.pagamento.findFirst({
        where: eq(schema.pagamento.providerEventId, evento.eventId),
      });
      if (ja) return { duplicado: true, cobrancaId: ja.cobrancaId };

      const inst = await tx.query.instrumento.findFirst({
        where: and(
          eq(schema.instrumento.provider, provider),
          eq(schema.instrumento.providerRef, evento.providerRef),
        ),
        with: { cobranca: true },
      });
      if (!inst) throw new Error(`Instrumento ${evento.providerRef} não encontrado`);

      const c = inst.cobranca;
      const principal = c.valorPrincipalCentavos;
      const excedente = Math.max(0, evento.valorPagoCentavos - principal);
      const multa = Math.min(excedente, Math.round((principal * c.multaBp) / 10_000));

      await tx.insert(schema.pagamento).values({
        cobrancaId: c.id,
        instrumentoId: inst.id,
        forma: inst.tipo,
        valorPagoCentavos: evento.valorPagoCentavos,
        principalCentavos: Math.min(principal, evento.valorPagoCentavos),
        multaCentavos: multa,
        jurosCentavos: excedente - multa,
        pagoEm: evento.pagoEm,
        providerEventId: evento.eventId,
      });
      await tx.update(schema.instrumento).set({ status: "pago" }).where(eq(schema.instrumento.id, inst.id));
      // Demais instrumentos ativos da cobrança deixam de valer.
      await tx
        .update(schema.instrumento)
        .set({ status: "cancelado" })
        .where(and(eq(schema.instrumento.cobrancaId, c.id), eq(schema.instrumento.status, "ativo")));
      if (c.status === "aberta") {
        await tx.update(schema.cobranca).set({ status: "paga" }).where(eq(schema.cobranca.id, c.id));
      }
      return { duplicado: false, cobrancaId: c.id };
    });
    await db
      .update(schema.webhookEvento)
      .set({ processadoEm: new Date() })
      .where(eq(schema.webhookEvento.id, log.id));
    return resultado;
  } catch (e) {
    await db
      .update(schema.webhookEvento)
      .set({ erro: e instanceof Error ? e.message : String(e) })
      .where(eq(schema.webhookEvento.id, log.id));
    throw e;
  }
}

/** Simula o banco confirmando o pagamento de um instrumento (somente gateway mock). */
export async function simularPagamentoMock(instrumentoId: string) {
  const inst = await db.query.instrumento.findFirst({ where: eq(schema.instrumento.id, instrumentoId) });
  if (!inst || inst.provider !== "mock") throw new Error("Instrumento mock não encontrado");
  if (inst.status !== "ativo") throw new Error("Instrumento não está ativo");
  const body = JSON.stringify({
    eventId: `mock-evt-${randomUUID()}`,
    providerRef: inst.providerRef,
    valorPagoCentavos: inst.valorCentavos,
    pagoEm: new Date().toISOString(),
  });
  // Mesmo caminho do webhook HTTP real, com assinatura.
  return processarWebhook("mock", body, new Headers({ "x-mock-signature": assinarMock(body) }));
}

function safeJson(body: string) {
  try {
    return JSON.parse(body);
  } catch {
    return { raw: body };
  }
}
