import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Convenções: dinheiro em centavos (integer), áreas em hectares numeric(10,2)
// (string no TS), percentuais em basis points (100 bp = 1%).

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const papelEnum = pgEnum("papel", ["associado", "operador", "admin"]);
export const situacaoCadastralEnum = pgEnum("situacao_cadastral", [
  "ativo",
  "inativo",
  "suspenso",
]);
export const cobrancaStatusEnum = pgEnum("cobranca_status", [
  "aberta",
  "paga",
  "cancelada",
]);
export const instrumentoTipoEnum = pgEnum("instrumento_tipo", ["boleto", "pix"]);
export const instrumentoStatusEnum = pgEnum("instrumento_status", [
  "ativo",
  "pago",
  "expirado",
  "cancelado",
]);
export const formaPagamentoEnum = pgEnum("forma_pagamento", [
  "boleto",
  "pix",
  "manual",
]);
export const avisoTipoEnum = pgEnum("aviso_tipo", [
  "manutencao",
  "assembleia",
  "orientacao",
]);

// ─── Acesso ────────────────────────────────────────────────────────────────

export const usuario = pgTable("usuario", {
  id: id(),
  cpf: text("cpf").notNull().unique(), // só dígitos
  nome: text("nome").notNull(),
  email: text("email"),
  senhaHash: text("senha_hash").notNull(),
  papel: papelEnum("papel").notNull().default("associado"),
  ativo: boolean("ativo").notNull().default(true),
  deveTrocarSenha: boolean("deve_trocar_senha").notNull().default(true),
  tentativasFalhas: integer("tentativas_falhas").notNull().default(0),
  bloqueadoAte: timestamp("bloqueado_ate", { withTimezone: true }),
  ultimoLoginEm: timestamp("ultimo_login_em", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessao = pgTable(
  "sessao",
  {
    id: text("id").primaryKey(), // sha256 do token do cookie
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id, { onDelete: "cascade" }),
    expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessao_usuario_idx").on(t.usuarioId)],
);

// ─── Cadastro ──────────────────────────────────────────────────────────────

export const associado = pgTable("associado", {
  id: id(),
  usuarioId: uuid("usuario_id")
    .notNull()
    .unique()
    .references(() => usuario.id, { onDelete: "restrict" }),
  matricula: text("matricula").notNull().unique(),
  nome: text("nome").notNull(),
  cpf: text("cpf").notNull().unique(),
  rg: text("rg"),
  dataNascimento: date("data_nascimento"),
  telefone: text("telefone"),
  email: text("email"),
  fotoKey: text("foto_key"),
  cep: text("cep"),
  logradouro: text("logradouro"),
  numero: text("numero"),
  bairro: text("bairro"),
  cidade: text("cidade"),
  uf: text("uf"),
  situacao: situacaoCadastralEnum("situacao").notNull().default("ativo"),
  dataAdmissao: date("data_admissao"),
  observacoes: text("observacoes"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const propriedade = pgTable(
  "propriedade",
  {
    id: id(),
    associadoId: uuid("associado_id")
      .notNull()
      .references(() => associado.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    localidade: text("localidade"),
    car: text("car"),
    canal: text("canal"),
    areaCadastradaHa: numeric("area_cadastrada_ha", { precision: 10, scale: 2 }).notNull(),
    areaIrrigadaHa: numeric("area_irrigada_ha", { precision: 10, scale: 2 }).notNull(),
    ativa: boolean("ativa").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("propriedade_associado_idx").on(t.associadoId)],
);

// Linha única (id = 1).
export const configuracao = pgTable("configuracao", {
  id: integer("id").primaryKey().default(1),
  valorHaCentavos: integer("valor_ha_centavos").notNull().default(0),
  multaBp: integer("multa_bp").notNull().default(0),
  jurosMesBp: integer("juros_mes_bp").notNull().default(0),
  jurosProRata: boolean("juros_pro_rata").notNull().default(true),
  diaVencimentoPadrao: integer("dia_vencimento_padrao").notNull().default(30),
  coopNome: text("coop_nome").notNull().default("Cooperativa de Irrigação de Meleiro"),
  coopCnpj: text("coop_cnpj"),
  coopTelefone: text("coop_telefone"),
  coopEndereco: text("coop_endereco"),
  updatedAt: updatedAt(),
});

// ─── Cobrança ──────────────────────────────────────────────────────────────

export const loteCobranca = pgTable("lote_cobranca", {
  id: id(),
  competencia: text("competencia").notNull(), // YYYY-MM
  vencimento: date("vencimento").notNull(),
  valorHaCentavos: integer("valor_ha_centavos").notNull(),
  geradoPor: uuid("gerado_por").references(() => usuario.id),
  createdAt: createdAt(),
});

export const cobranca = pgTable(
  "cobranca",
  {
    id: id(),
    loteId: uuid("lote_id").references(() => loteCobranca.id),
    associadoId: uuid("associado_id")
      .notNull()
      .references(() => associado.id, { onDelete: "restrict" }),
    propriedadeId: uuid("propriedade_id")
      .notNull()
      .references(() => propriedade.id, { onDelete: "restrict" }),
    descricao: text("descricao").notNull().default("Taxa de irrigação"),
    competencia: text("competencia").notNull(),
    vencimento: date("vencimento").notNull(),
    // snapshots no momento da emissão
    areaIrrigadaHa: numeric("area_irrigada_ha", { precision: 10, scale: 2 }).notNull(),
    valorHaCentavos: integer("valor_ha_centavos").notNull(),
    valorPrincipalCentavos: integer("valor_principal_centavos").notNull(),
    multaBp: integer("multa_bp").notNull().default(0),
    jurosMesBp: integer("juros_mes_bp").notNull().default(0),
    jurosProRata: boolean("juros_pro_rata").notNull().default(true),
    status: cobrancaStatusEnum("status").notNull().default("aberta"),
    canceladaMotivo: text("cancelada_motivo"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("cobranca_associado_idx").on(t.associadoId),
    // uma cobrança por propriedade/competência (exceto canceladas)
    uniqueIndex("cobranca_prop_comp_uniq")
      .on(t.propriedadeId, t.competencia)
      .where(sql`${t.status} <> 'cancelada'`),
  ],
);

export const instrumento = pgTable(
  "instrumento",
  {
    id: id(),
    cobrancaId: uuid("cobranca_id")
      .notNull()
      .references(() => cobranca.id, { onDelete: "cascade" }),
    tipo: instrumentoTipoEnum("tipo").notNull(),
    provider: text("provider").notNull(),
    providerRef: text("provider_ref").notNull(),
    linhaDigitavel: text("linha_digitavel"),
    codigoBarras: text("codigo_barras"),
    pixCopiaCola: text("pix_copia_cola"),
    valorCentavos: integer("valor_centavos").notNull(),
    expiraEm: timestamp("expira_em", { withTimezone: true }),
    status: instrumentoStatusEnum("status").notNull().default("ativo"),
    createdAt: createdAt(),
  },
  (t) => [
    index("instrumento_cobranca_idx").on(t.cobrancaId),
    uniqueIndex("instrumento_provider_ref_uniq").on(t.provider, t.providerRef),
  ],
);

export const pagamento = pgTable(
  "pagamento",
  {
    id: id(),
    cobrancaId: uuid("cobranca_id")
      .notNull()
      .references(() => cobranca.id, { onDelete: "restrict" }),
    instrumentoId: uuid("instrumento_id").references(() => instrumento.id),
    forma: formaPagamentoEnum("forma").notNull(),
    valorPagoCentavos: integer("valor_pago_centavos").notNull(),
    principalCentavos: integer("principal_centavos").notNull(),
    multaCentavos: integer("multa_centavos").notNull().default(0),
    jurosCentavos: integer("juros_centavos").notNull().default(0),
    pagoEm: timestamp("pago_em", { withTimezone: true }).notNull(),
    providerEventId: text("provider_event_id").unique(),
    baixadoPor: uuid("baixado_por").references(() => usuario.id),
    observacao: text("observacao"),
    createdAt: createdAt(),
  },
  (t) => [index("pagamento_cobranca_idx").on(t.cobrancaId)],
);

export const webhookEvento = pgTable("webhook_evento", {
  id: id(),
  provider: text("provider").notNull(),
  payload: jsonb("payload").notNull(),
  recebidoEm: timestamp("recebido_em", { withTimezone: true }).notNull().defaultNow(),
  processadoEm: timestamp("processado_em", { withTimezone: true }),
  erro: text("erro"),
});

// ─── Comunicação ───────────────────────────────────────────────────────────

export const aviso = pgTable("aviso", {
  id: id(),
  tipo: avisoTipoEnum("tipo").notNull(),
  titulo: text("titulo").notNull(),
  resumo: text("resumo").notNull(),
  corpo: text("corpo"),
  dataEvento: timestamp("data_evento", { withTimezone: true }),
  local: text("local"),
  publicadoEm: timestamp("publicado_em", { withTimezone: true }),
  expiraEm: timestamp("expira_em", { withTimezone: true }),
  criadoPor: uuid("criado_por").references(() => usuario.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const avisoLeitura = pgTable(
  "aviso_leitura",
  {
    associadoId: uuid("associado_id")
      .notNull()
      .references(() => associado.id, { onDelete: "cascade" }),
    avisoId: uuid("aviso_id")
      .notNull()
      .references(() => aviso.id, { onDelete: "cascade" }),
    lidoEm: timestamp("lido_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("aviso_leitura_pk").on(t.associadoId, t.avisoId)],
);

export const cotacao = pgTable(
  "cotacao",
  {
    id: id(),
    produto: text("produto").notNull().default("Arroz em casca"),
    regiao: text("regiao").notNull().default("Santa Catarina"),
    unidade: text("unidade").notNull().default("Saca de 50 kg"),
    valorCentavos: integer("valor_centavos").notNull(),
    fonte: text("fonte").notNull().default("CEPA/SC"),
    referenciaEm: timestamp("referencia_em", { withTimezone: true }).notNull(),
    lancadoPor: uuid("lancado_por").references(() => usuario.id),
    createdAt: createdAt(),
  },
  (t) => [index("cotacao_ref_idx").on(t.referenciaEm)],
);

export const auditLog = pgTable("audit_log", {
  id: id(),
  usuarioId: uuid("usuario_id").references(() => usuario.id),
  acao: text("acao").notNull(),
  entidade: text("entidade").notNull(),
  entidadeId: text("entidade_id"),
  dados: jsonb("dados"),
  createdAt: createdAt(),
});

// ─── Relações ──────────────────────────────────────────────────────────────

export const usuarioRelations = relations(usuario, ({ one }) => ({
  associado: one(associado, { fields: [usuario.id], references: [associado.usuarioId] }),
}));

export const associadoRelations = relations(associado, ({ one, many }) => ({
  usuario: one(usuario, { fields: [associado.usuarioId], references: [usuario.id] }),
  propriedades: many(propriedade),
  cobrancas: many(cobranca),
}));

export const propriedadeRelations = relations(propriedade, ({ one }) => ({
  associado: one(associado, {
    fields: [propriedade.associadoId],
    references: [associado.id],
  }),
}));

export const cobrancaRelations = relations(cobranca, ({ one, many }) => ({
  associado: one(associado, { fields: [cobranca.associadoId], references: [associado.id] }),
  propriedade: one(propriedade, {
    fields: [cobranca.propriedadeId],
    references: [propriedade.id],
  }),
  instrumentos: many(instrumento),
  pagamentos: many(pagamento),
}));

export const instrumentoRelations = relations(instrumento, ({ one }) => ({
  cobranca: one(cobranca, { fields: [instrumento.cobrancaId], references: [cobranca.id] }),
}));

export const pagamentoRelations = relations(pagamento, ({ one }) => ({
  cobranca: one(cobranca, { fields: [pagamento.cobrancaId], references: [cobranca.id] }),
  instrumento: one(instrumento, {
    fields: [pagamento.instrumentoId],
    references: [instrumento.id],
  }),
}));
