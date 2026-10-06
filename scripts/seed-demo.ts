// Dados de demonstração para o app do associado. Idempotente: apaga e recria
// apenas o associado demo (CPF 111.444.777-35), seus dados, e os avisos/cotações demo.
// Uso: npm run db:seed-demo   → login: 111.444.777-35 / demo1234
import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../lib/db/schema";

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema, casing: "snake_case" });

const CPF = "11144477735";
const VALOR_HA = 13_000;

const AVISOS = [
  {
    tipo: "manutencao" as const,
    titulo: "Manutenção no canal",
    resumo:
      "Informamos aos associados que haverá manutenção no canal de irrigação. Pedimos a compreensão de todos.",
    corpo:
      "Informamos aos associados que haverá manutenção no canal principal de irrigação no dia 28/09, das 08h às 17h.\n\nDurante o período o fornecimento de água poderá ser interrompido. Pedimos a compreensão de todos.",
    dataEvento: new Date("2026-09-28T08:00:00-03:00"),
    publicadoEm: new Date("2026-09-20T10:00:00-03:00"),
  },
  {
    tipo: "assembleia" as const,
    titulo: "Assembleia Geral",
    resumo: "Convocamos todos os associados para a Assembleia Geral Ordinária.",
    corpo:
      "Convocamos todos os associados para a Assembleia Geral Ordinária.\n\nPauta: prestação de contas, tarifa da próxima safra e assuntos gerais.",
    dataEvento: new Date("2026-10-15T19:00:00-03:00"),
    local: "Salão da Comunidade Meleiro/SC",
    publicadoEm: new Date("2026-10-01T09:00:00-03:00"),
  },
  {
    tipo: "orientacao" as const,
    titulo: "Orientações importantes",
    resumo: "Lembramos da importância da manutenção dos canais e comportas.",
    corpo:
      "Lembramos da importância da manutenção dos canais e comportas em cada propriedade. Mantenha as comportas limpas e comunique a cooperativa sobre vazamentos.",
    dataEvento: null,
    publicadoEm: new Date("2026-09-10T08:00:00-03:00"),
  },
];

const COTACOES = [
  { valorCentavos: 7_620, referenciaEm: new Date("2026-09-09T08:30:00-03:00") },
  { valorCentavos: 7_790, referenciaEm: new Date("2026-09-16T08:30:00-03:00") },
  { valorCentavos: 7_850, referenciaEm: new Date("2026-09-23T08:30:00-03:00") },
];

async function limpar() {
  const u = await db.query.usuario.findFirst({ where: eq(schema.usuario.cpf, CPF) });
  if (u) {
    const a = await db.query.associado.findFirst({ where: eq(schema.associado.usuarioId, u.id) });
    if (a) {
      const cobs = await db
        .select({ id: schema.cobranca.id })
        .from(schema.cobranca)
        .where(eq(schema.cobranca.associadoId, a.id));
      const ids = cobs.map((c) => c.id);
      if (ids.length) {
        await db.delete(schema.pagamento).where(inArray(schema.pagamento.cobrancaId, ids));
        await db.delete(schema.instrumento).where(inArray(schema.instrumento.cobrancaId, ids));
        await db.delete(schema.cobranca).where(inArray(schema.cobranca.id, ids));
      }
      await db.delete(schema.associado).where(eq(schema.associado.id, a.id));
    }
    await db.delete(schema.usuario).where(eq(schema.usuario.id, u.id));
  }
  await db
    .delete(schema.aviso)
    .where(and(isNull(schema.aviso.criadoPor), inArray(schema.aviso.titulo, AVISOS.map((a) => a.titulo))));
  for (const c of COTACOES) {
    await db
      .delete(schema.cotacao)
      .where(and(isNull(schema.cotacao.lancadoPor), eq(schema.cotacao.referenciaEm, c.referenciaEm)));
  }
}

async function main() {
  await limpar();

  await db
    .insert(schema.configuracao)
    .values({ id: 1, valorHaCentavos: VALOR_HA })
    .onConflictDoUpdate({ target: schema.configuracao.id, set: { valorHaCentavos: VALOR_HA } });

  const [u] = await db
    .insert(schema.usuario)
    .values({
      cpf: CPF,
      nome: "João da Silva",
      email: "joao.demo@example.com",
      senhaHash: await hash("demo1234", { memoryCost: 19456, timeCost: 2, parallelism: 1 }),
      papel: "associado",
      deveTrocarSenha: false,
    })
    .returning();

  const [a] = await db
    .insert(schema.associado)
    .values({
      usuarioId: u.id,
      matricula: "0125",
      nome: "João da Silva",
      cpf: CPF,
      telefone: "48999991234",
      email: "joao.demo@example.com",
      cidade: "Meleiro",
      uf: "SC",
      dataAdmissao: "2010-03-15",
    })
    .returning();

  const [fazenda, lote] = await db
    .insert(schema.propriedade)
    .values([
      { associadoId: a.id, nome: "Fazenda São João", localidade: "Linha Ipiranga", areaCadastradaHa: "18.50", areaIrrigadaHa: "16.00" },
      { associadoId: a.id, nome: "Lote Rio Pequeno", localidade: "Rio Pequeno", areaCadastradaHa: "5.00", areaIrrigadaHa: "4.00" },
    ])
    .returning();

  // [propriedade, vencimento, pagoEm | null, forma]
  const plano: [typeof fazenda, string, string | null, "boleto" | "pix"][] = [
    [fazenda, "2025-09-30", "2025-09-29T10:12:00-03:00", "boleto"],
    [fazenda, "2025-12-30", "2025-12-22T14:40:00-03:00", "pix"],
    [fazenda, "2026-03-30", "2026-03-15T09:05:00-03:00", "boleto"],
    [fazenda, "2026-06-30", "2026-06-30T16:20:00-03:00", "pix"],
    [fazenda, "2026-09-30", null, "pix"], // vencida
    [fazenda, "2026-12-30", null, "pix"], // a vencer
    [lote, "2026-06-30", "2026-06-28T11:00:00-03:00", "pix"],
    [lote, "2026-09-30", "2026-09-23T10:15:00-03:00", "pix"],
    [lote, "2026-12-30", null, "pix"], // a vencer
  ];

  for (const [p, venc, pagoEm, forma] of plano) {
    const valor = Math.round((Math.round(Number(p.areaIrrigadaHa) * 100) * VALOR_HA) / 100);
    const [c] = await db
      .insert(schema.cobranca)
      .values({
        associadoId: a.id,
        propriedadeId: p.id,
        competencia: venc.slice(0, 7),
        vencimento: venc,
        areaIrrigadaHa: p.areaIrrigadaHa,
        valorHaCentavos: VALOR_HA,
        valorPrincipalCentavos: valor,
        status: pagoEm ? "paga" : "aberta",
      })
      .returning();
    if (pagoEm) {
      await db.insert(schema.pagamento).values({
        cobrancaId: c.id,
        forma,
        valorPagoCentavos: valor,
        principalCentavos: valor,
        pagoEm: new Date(pagoEm),
        providerEventId: `demo-${c.id}`,
      });
    }
  }

  await db.insert(schema.aviso).values(AVISOS);
  await db.insert(schema.cotacao).values(COTACOES.map((c) => ({ ...c })));

  console.log("Demo pronta. Login: 111.444.777-35 / demo1234");
}

main().finally(() => client.end());
