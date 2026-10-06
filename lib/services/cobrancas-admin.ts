import "server-only";
import { and, asc, eq, ne } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { valorPrincipal } from "@/lib/domain/cobranca";

export async function obterConfiguracao() {
  const c = await db.query.configuracao.findFirst({ where: eq(schema.configuracao.id, 1) });
  if (c) return c;
  const [novo] = await db.insert(schema.configuracao).values({ id: 1 }).onConflictDoNothing().returning();
  return novo ?? (await db.query.configuracao.findFirst({ where: eq(schema.configuracao.id, 1) }))!;
}

export type ItemPrevia = {
  propriedadeId: string;
  propriedade: string;
  associadoId: string;
  associado: string;
  matricula: string;
  areaIrrigadaHa: string;
  valorCentavos: number;
  jaExiste: boolean;
};

/** Associados ativos × propriedades ativas com área irrigada > 0. */
export async function previaLote(competencia: string, valorHaCentavos: number): Promise<ItemPrevia[]> {
  const rows = await db
    .select({
      propriedadeId: schema.propriedade.id,
      propriedade: schema.propriedade.nome,
      associadoId: schema.associado.id,
      associado: schema.associado.nome,
      matricula: schema.associado.matricula,
      areaIrrigadaHa: schema.propriedade.areaIrrigadaHa,
    })
    .from(schema.propriedade)
    .innerJoin(schema.associado, eq(schema.associado.id, schema.propriedade.associadoId))
    .where(and(eq(schema.propriedade.ativa, true), eq(schema.associado.situacao, "ativo")))
    .orderBy(asc(schema.associado.nome), asc(schema.propriedade.nome));

  const existentes = await db
    .select({ propriedadeId: schema.cobranca.propriedadeId })
    .from(schema.cobranca)
    .where(and(eq(schema.cobranca.competencia, competencia), ne(schema.cobranca.status, "cancelada")));
  const ja = new Set(existentes.map((e) => e.propriedadeId));

  return rows
    .filter((r) => Number(r.areaIrrigadaHa) > 0)
    .map((r) => ({
      ...r,
      valorCentavos: valorPrincipal(r.areaIrrigadaHa, valorHaCentavos),
      jaExiste: ja.has(r.propriedadeId),
    }));
}
