"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireAssociado } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { ehMock } from "@/lib/payments";
import { statusDaCobranca } from "@/lib/services/app";
import { simularPagamentoMock } from "@/lib/services/pagamentos";

/** Consultado pela Tela 13 enquanto aguarda o Pix. */
export async function consultarStatusCobranca(cobrancaId: string) {
  const { associado } = await requireAssociado();
  return statusDaCobranca(associado.id, cobrancaId);
}

/** Somente com o gateway mock: simula o banco confirmando o pagamento. */
export async function simularPagamento(cobrancaId: string, tipo: "boleto" | "pix") {
  if (!ehMock()) throw new Error("Indisponível");
  const { associado } = await requireAssociado();
  const [inst] = await db
    .select({ id: schema.instrumento.id })
    .from(schema.instrumento)
    .innerJoin(schema.cobranca, eq(schema.cobranca.id, schema.instrumento.cobrancaId))
    .where(
      and(
        eq(schema.instrumento.cobrancaId, cobrancaId),
        eq(schema.instrumento.tipo, tipo),
        eq(schema.instrumento.status, "ativo"),
        eq(schema.cobranca.associadoId, associado.id),
      ),
    )
    .limit(1);
  if (!inst) throw new Error("Nenhum instrumento ativo");
  await simularPagamentoMock(inst.id);
  redirect(`/pagamentos/${cobrancaId}/sucesso`);
}
