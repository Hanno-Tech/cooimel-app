import "server-only";
import { and, asc, desc, eq, gt, inArray, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { situacaoAssociado, statusVisual } from "@/lib/domain/cobranca";
import { hojeISO } from "@/lib/format";
import { encargosAtuais } from "@/lib/services/pagamentos";

// Consultas do app do associado. Toda função recebe o associadoId da sessão
// (requireAssociado) e filtra por ele — nunca por um id vindo da URL sozinho.

type Cobranca = typeof schema.cobranca.$inferSelect;

function comStatus<T extends Cobranca>(c: T, hoje = hojeISO()) {
  return { ...c, statusVisual: statusVisual(c, hoje), encargos: encargosAtuais(c) };
}

export type CobrancaComStatus = ReturnType<typeof comStatus<Cobranca & { propriedade: { nome: string } }>>;

export async function propriedadesDoAssociado(associadoId: string) {
  return db.query.propriedade.findMany({
    where: eq(schema.propriedade.associadoId, associadoId),
    orderBy: [desc(schema.propriedade.ativa), asc(schema.propriedade.nome)],
  });
}

export async function dadosInicio(associadoId: string) {
  const hoje = hojeISO();
  const [props, abertas] = await Promise.all([
    propriedadesDoAssociado(associadoId),
    db.query.cobranca.findMany({
      where: and(eq(schema.cobranca.associadoId, associadoId), eq(schema.cobranca.status, "aberta")),
      orderBy: asc(schema.cobranca.vencimento),
    }),
  ]);
  const ativas = props.filter((p) => p.ativa);
  const areaCadastrada = ativas.reduce((s, p) => s + Number(p.areaCadastradaHa), 0);
  const areaIrrigada = ativas.reduce((s, p) => s + Number(p.areaIrrigadaHa), 0);
  const cobs = abertas.map((c) => comStatus(c, hoje));
  const valorAberto = cobs.reduce((s, c) => s + c.encargos.total, 0);
  const vencidas = cobs.filter((c) => c.statusVisual === "vencida");
  return {
    areaCadastrada,
    areaIrrigada,
    valorAberto,
    qtdAbertas: cobs.length,
    qtdVencidas: vencidas.length,
    // a mais antiga vencida, senão o próximo vencimento
    proximoVencimento: (vencidas[0] ?? cobs[0])?.vencimento ?? null,
    situacao: situacaoAssociado(abertas, hoje),
  };
}

export type FiltroCobranca = "abertas" | "pagas" | "todas";

export async function listarCobrancas(associadoId: string, filtro: FiltroCobranca, ano?: number) {
  const conds = [eq(schema.cobranca.associadoId, associadoId)];
  if (filtro === "abertas") conds.push(eq(schema.cobranca.status, "aberta"));
  else if (filtro === "pagas") conds.push(eq(schema.cobranca.status, "paga"));
  else conds.push(inArray(schema.cobranca.status, ["aberta", "paga"]));
  if (ano) {
    conds.push(
      and(
        sql`${schema.cobranca.vencimento} >= ${`${ano}-01-01`}`,
        sql`${schema.cobranca.vencimento} <= ${`${ano}-12-31`}`,
      )!,
    );
  }
  const hoje = hojeISO();
  const rows = await db.query.cobranca.findMany({
    where: and(...conds),
    with: { propriedade: { columns: { nome: true } } },
    orderBy: asc(schema.cobranca.vencimento),
  });
  return rows.map((c) => comStatus(c, hoje));
}

export async function anosComCobranca(associadoId: string) {
  const rows = await db
    .selectDistinct({ ano: sql<number>`extract(year from ${schema.cobranca.vencimento})::int` })
    .from(schema.cobranca)
    .where(eq(schema.cobranca.associadoId, associadoId));
  return rows.map((r) => r.ano).sort((a, b) => b - a);
}

/** Cobrança do associado (404 se for de outro). */
export async function obterCobranca(associadoId: string, cobrancaId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(cobrancaId)) notFound();
  const c = await db.query.cobranca.findFirst({
    where: and(eq(schema.cobranca.id, cobrancaId), eq(schema.cobranca.associadoId, associadoId)),
    with: {
      propriedade: { columns: { nome: true } },
      pagamentos: { orderBy: desc(schema.pagamento.pagoEm) },
    },
  });
  if (!c || c.status === "cancelada") notFound();
  return comStatus(c);
}

export async function temMaisDeUmaPropriedade(associadoId: string) {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.propriedade)
    .where(eq(schema.propriedade.associadoId, associadoId));
  return (r?.n ?? 0) > 1;
}

export async function listarPagamentos(associadoId: string, forma?: "boleto" | "pix") {
  const conds = [eq(schema.cobranca.associadoId, associadoId)];
  if (forma) conds.push(eq(schema.pagamento.forma, forma));
  return db
    .select({
      id: schema.pagamento.id,
      cobrancaId: schema.pagamento.cobrancaId,
      forma: schema.pagamento.forma,
      valorPagoCentavos: schema.pagamento.valorPagoCentavos,
      pagoEm: schema.pagamento.pagoEm,
      descricao: schema.cobranca.descricao,
      competencia: schema.cobranca.competencia,
      propriedade: schema.propriedade.nome,
    })
    .from(schema.pagamento)
    .innerJoin(schema.cobranca, eq(schema.cobranca.id, schema.pagamento.cobrancaId))
    .innerJoin(schema.propriedade, eq(schema.propriedade.id, schema.cobranca.propriedadeId))
    .where(and(...conds))
    .orderBy(desc(schema.pagamento.pagoEm));
}

export async function cotacoes(limite = 20) {
  return db.query.cotacao.findMany({
    orderBy: desc(schema.cotacao.referenciaEm),
    limit: limite,
  });
}

const avisoVisivel = () => {
  const agora = new Date();
  return and(
    isNotNull(schema.aviso.publicadoEm),
    lte(schema.aviso.publicadoEm, agora),
    or(isNull(schema.aviso.expiraEm), gt(schema.aviso.expiraEm, agora)),
  );
};

export async function listarAvisos(associadoId: string) {
  return db
    .select({
      id: schema.aviso.id,
      tipo: schema.aviso.tipo,
      titulo: schema.aviso.titulo,
      resumo: schema.aviso.resumo,
      dataEvento: schema.aviso.dataEvento,
      local: schema.aviso.local,
      publicadoEm: schema.aviso.publicadoEm,
      lidoEm: schema.avisoLeitura.lidoEm,
    })
    .from(schema.aviso)
    .leftJoin(
      schema.avisoLeitura,
      and(
        eq(schema.avisoLeitura.avisoId, schema.aviso.id),
        eq(schema.avisoLeitura.associadoId, associadoId),
      ),
    )
    .where(avisoVisivel())
    .orderBy(desc(schema.aviso.publicadoEm));
}

export async function obterAviso(avisoId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(avisoId)) notFound();
  const a = await db.query.aviso.findFirst({
    where: and(eq(schema.aviso.id, avisoId), avisoVisivel()),
  });
  if (!a) notFound();
  return a;
}

export async function marcarAvisoLido(associadoId: string, avisoId: string) {
  await db.insert(schema.avisoLeitura).values({ associadoId, avisoId }).onConflictDoNothing();
}

export async function contarAvisosNaoLidos(associadoId: string) {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.aviso)
    .leftJoin(
      schema.avisoLeitura,
      and(
        eq(schema.avisoLeitura.avisoId, schema.aviso.id),
        eq(schema.avisoLeitura.associadoId, associadoId),
      ),
    )
    .where(and(avisoVisivel(), isNull(schema.avisoLeitura.avisoId)));
  return r?.n ?? 0;
}

export async function statusDaCobranca(associadoId: string, cobrancaId: string) {
  const c = await db.query.cobranca.findFirst({
    where: and(eq(schema.cobranca.id, cobrancaId), eq(schema.cobranca.associadoId, associadoId)),
    columns: { status: true },
  });
  return c?.status ?? null;
}
