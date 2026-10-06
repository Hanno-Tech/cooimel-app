CREATE TYPE "public"."aviso_tipo" AS ENUM('manutencao', 'assembleia', 'orientacao');--> statement-breakpoint
CREATE TYPE "public"."cobranca_status" AS ENUM('aberta', 'paga', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."forma_pagamento" AS ENUM('boleto', 'pix', 'manual');--> statement-breakpoint
CREATE TYPE "public"."instrumento_status" AS ENUM('ativo', 'pago', 'expirado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."instrumento_tipo" AS ENUM('boleto', 'pix');--> statement-breakpoint
CREATE TYPE "public"."papel" AS ENUM('associado', 'operador', 'admin');--> statement-breakpoint
CREATE TYPE "public"."situacao_cadastral" AS ENUM('ativo', 'inativo', 'suspenso');--> statement-breakpoint
CREATE TABLE "associado" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"matricula" text NOT NULL,
	"nome" text NOT NULL,
	"cpf" text NOT NULL,
	"rg" text,
	"data_nascimento" date,
	"telefone" text,
	"email" text,
	"foto_key" text,
	"cep" text,
	"logradouro" text,
	"numero" text,
	"bairro" text,
	"cidade" text,
	"uf" text,
	"situacao" "situacao_cadastral" DEFAULT 'ativo' NOT NULL,
	"data_admissao" date,
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "associado_usuario_id_unique" UNIQUE("usuario_id"),
	CONSTRAINT "associado_matricula_unique" UNIQUE("matricula"),
	CONSTRAINT "associado_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid,
	"acao" text NOT NULL,
	"entidade" text NOT NULL,
	"entidade_id" text,
	"dados" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aviso" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" "aviso_tipo" NOT NULL,
	"titulo" text NOT NULL,
	"resumo" text NOT NULL,
	"corpo" text,
	"data_evento" timestamp with time zone,
	"local" text,
	"publicado_em" timestamp with time zone,
	"expira_em" timestamp with time zone,
	"criado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aviso_leitura" (
	"associado_id" uuid NOT NULL,
	"aviso_id" uuid NOT NULL,
	"lido_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cobranca" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lote_id" uuid,
	"associado_id" uuid NOT NULL,
	"propriedade_id" uuid NOT NULL,
	"descricao" text DEFAULT 'Taxa de irrigação' NOT NULL,
	"competencia" text NOT NULL,
	"vencimento" date NOT NULL,
	"area_irrigada_ha" numeric(10, 2) NOT NULL,
	"valor_ha_centavos" integer NOT NULL,
	"valor_principal_centavos" integer NOT NULL,
	"multa_bp" integer DEFAULT 0 NOT NULL,
	"juros_mes_bp" integer DEFAULT 0 NOT NULL,
	"juros_pro_rata" boolean DEFAULT true NOT NULL,
	"status" "cobranca_status" DEFAULT 'aberta' NOT NULL,
	"cancelada_motivo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "configuracao" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"valor_ha_centavos" integer DEFAULT 0 NOT NULL,
	"multa_bp" integer DEFAULT 0 NOT NULL,
	"juros_mes_bp" integer DEFAULT 0 NOT NULL,
	"juros_pro_rata" boolean DEFAULT true NOT NULL,
	"dia_vencimento_padrao" integer DEFAULT 30 NOT NULL,
	"coop_nome" text DEFAULT 'Cooperativa de Irrigação de Meleiro' NOT NULL,
	"coop_cnpj" text,
	"coop_telefone" text,
	"coop_endereco" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cotacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"produto" text DEFAULT 'Arroz em casca' NOT NULL,
	"regiao" text DEFAULT 'Santa Catarina' NOT NULL,
	"unidade" text DEFAULT 'Saca de 50 kg' NOT NULL,
	"valor_centavos" integer NOT NULL,
	"fonte" text DEFAULT 'CEPA/SC' NOT NULL,
	"referencia_em" timestamp with time zone NOT NULL,
	"lancado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instrumento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cobranca_id" uuid NOT NULL,
	"tipo" "instrumento_tipo" NOT NULL,
	"provider" text NOT NULL,
	"provider_ref" text NOT NULL,
	"linha_digitavel" text,
	"codigo_barras" text,
	"pix_copia_cola" text,
	"valor_centavos" integer NOT NULL,
	"expira_em" timestamp with time zone,
	"status" "instrumento_status" DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lote_cobranca" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competencia" text NOT NULL,
	"vencimento" date NOT NULL,
	"valor_ha_centavos" integer NOT NULL,
	"gerado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pagamento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cobranca_id" uuid NOT NULL,
	"instrumento_id" uuid,
	"forma" "forma_pagamento" NOT NULL,
	"valor_pago_centavos" integer NOT NULL,
	"principal_centavos" integer NOT NULL,
	"multa_centavos" integer DEFAULT 0 NOT NULL,
	"juros_centavos" integer DEFAULT 0 NOT NULL,
	"pago_em" timestamp with time zone NOT NULL,
	"provider_event_id" text,
	"baixado_por" uuid,
	"observacao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pagamento_provider_event_id_unique" UNIQUE("provider_event_id")
);
--> statement-breakpoint
CREATE TABLE "propriedade" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"associado_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"localidade" text,
	"car" text,
	"canal" text,
	"area_cadastrada_ha" numeric(10, 2) NOT NULL,
	"area_irrigada_ha" numeric(10, 2) NOT NULL,
	"ativa" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessao" (
	"id" text PRIMARY KEY NOT NULL,
	"usuario_id" uuid NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cpf" text NOT NULL,
	"nome" text NOT NULL,
	"email" text,
	"senha_hash" text NOT NULL,
	"papel" "papel" DEFAULT 'associado' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"deve_trocar_senha" boolean DEFAULT true NOT NULL,
	"tentativas_falhas" integer DEFAULT 0 NOT NULL,
	"bloqueado_ate" timestamp with time zone,
	"ultimo_login_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuario_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
CREATE TABLE "webhook_evento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"payload" jsonb NOT NULL,
	"recebido_em" timestamp with time zone DEFAULT now() NOT NULL,
	"processado_em" timestamp with time zone,
	"erro" text
);
--> statement-breakpoint
ALTER TABLE "associado" ADD CONSTRAINT "associado_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aviso" ADD CONSTRAINT "aviso_criado_por_usuario_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aviso_leitura" ADD CONSTRAINT "aviso_leitura_associado_id_associado_id_fk" FOREIGN KEY ("associado_id") REFERENCES "public"."associado"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aviso_leitura" ADD CONSTRAINT "aviso_leitura_aviso_id_aviso_id_fk" FOREIGN KEY ("aviso_id") REFERENCES "public"."aviso"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cobranca" ADD CONSTRAINT "cobranca_lote_id_lote_cobranca_id_fk" FOREIGN KEY ("lote_id") REFERENCES "public"."lote_cobranca"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cobranca" ADD CONSTRAINT "cobranca_associado_id_associado_id_fk" FOREIGN KEY ("associado_id") REFERENCES "public"."associado"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cobranca" ADD CONSTRAINT "cobranca_propriedade_id_propriedade_id_fk" FOREIGN KEY ("propriedade_id") REFERENCES "public"."propriedade"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotacao" ADD CONSTRAINT "cotacao_lancado_por_usuario_id_fk" FOREIGN KEY ("lancado_por") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instrumento" ADD CONSTRAINT "instrumento_cobranca_id_cobranca_id_fk" FOREIGN KEY ("cobranca_id") REFERENCES "public"."cobranca"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lote_cobranca" ADD CONSTRAINT "lote_cobranca_gerado_por_usuario_id_fk" FOREIGN KEY ("gerado_por") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_cobranca_id_cobranca_id_fk" FOREIGN KEY ("cobranca_id") REFERENCES "public"."cobranca"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_instrumento_id_instrumento_id_fk" FOREIGN KEY ("instrumento_id") REFERENCES "public"."instrumento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_baixado_por_usuario_id_fk" FOREIGN KEY ("baixado_por") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "propriedade" ADD CONSTRAINT "propriedade_associado_id_associado_id_fk" FOREIGN KEY ("associado_id") REFERENCES "public"."associado"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao" ADD CONSTRAINT "sessao_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "aviso_leitura_pk" ON "aviso_leitura" USING btree ("associado_id","aviso_id");--> statement-breakpoint
CREATE INDEX "cobranca_associado_idx" ON "cobranca" USING btree ("associado_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cobranca_prop_comp_uniq" ON "cobranca" USING btree ("propriedade_id","competencia") WHERE "cobranca"."status" <> 'cancelada';--> statement-breakpoint
CREATE INDEX "cotacao_ref_idx" ON "cotacao" USING btree ("referencia_em");--> statement-breakpoint
CREATE INDEX "instrumento_cobranca_idx" ON "instrumento" USING btree ("cobranca_id");--> statement-breakpoint
CREATE UNIQUE INDEX "instrumento_provider_ref_uniq" ON "instrumento" USING btree ("provider","provider_ref");--> statement-breakpoint
CREATE INDEX "pagamento_cobranca_idx" ON "pagamento" USING btree ("cobranca_id");--> statement-breakpoint
CREATE INDEX "propriedade_associado_idx" ON "propriedade" USING btree ("associado_id");--> statement-breakpoint
CREATE INDEX "sessao_usuario_idx" ON "sessao" USING btree ("usuario_id");