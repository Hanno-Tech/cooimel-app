"use server";

import { randomBytes } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import * as z from "zod";
import { registrarAuditoria } from "@/lib/audit";
import { REGRA_SENHA, gerarSenhaTemporaria, hashSenha, senhaForte } from "@/lib/auth/senha";
import { encerrarTodasSessoes, requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { cpfValido, somenteDigitos } from "@/lib/format";
import { removerArquivo, salvarArquivo } from "@/lib/storage";

export type ActionState =
  | {
      ok?: boolean;
      erro?: string;
      campos?: Record<string, string>;
      senhaGerada?: string;
      id?: string;
    }
  | undefined;

const opcional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable();

const dadosSchema = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo"),
  cpf: z
    .string()
    .transform(somenteDigitos)
    .refine(cpfValido, "CPF inválido"),
  matricula: z.string().trim().min(1, "Informe a matrícula"),
  rg: opcional,
  dataNascimento: opcional,
  telefone: opcional.transform((v) => (v ? somenteDigitos(v) : null)),
  email: opcional.refine((v) => !v || z.email().safeParse(v).success, "E-mail inválido"),
  cep: opcional.transform((v) => (v ? somenteDigitos(v) : null)),
  logradouro: opcional,
  numero: opcional,
  bairro: opcional,
  cidade: opcional,
  uf: opcional.transform((v) => (v ? v.toUpperCase().slice(0, 2) : null)),
  dataAdmissao: opcional,
  situacao: z.enum(["ativo", "inativo", "suspenso"]).default("ativo"),
  observacoes: opcional,
});

function lerDados(fd: FormData) {
  const obj: Record<string, string> = {};
  for (const k of Object.keys(dadosSchema.shape)) obj[k] = String(fd.get(k) ?? "");
  if (!obj.situacao) obj.situacao = "ativo";
  return dadosSchema.safeParse(obj);
}

function errosDe(e: z.ZodError) {
  const campos: Record<string, string> = {};
  for (const i of e.issues) campos[String(i.path[0])] ??= i.message;
  return { erro: "Verifique os campos destacados.", campos };
}

const FOTO_MAX = 5 * 1024 * 1024;

async function processarFoto(associadoId: string, arquivo: File, keyAntiga: string | null) {
  if (arquivo.size > FOTO_MAX) throw new Error("Foto maior que 5 MB");
  if (!arquivo.type.startsWith("image/")) throw new Error("Arquivo não é uma imagem");
  // Re-encode: normaliza formato/tamanho e remove EXIF (localização etc.).
  const webp = await sharp(Buffer.from(await arquivo.arrayBuffer()))
    .rotate()
    .resize(512, 512, { fit: "cover" })
    .webp({ quality: 82 })
    .toBuffer();
  const key = `associados/${associadoId}/${randomBytes(8).toString("hex")}.webp`;
  await salvarArquivo(key, webp, "image/webp");
  await db.update(schema.associado).set({ fotoKey: key }).where(eq(schema.associado.id, associadoId));
  if (keyAntiga) await removerArquivo(keyAntiga).catch(() => {});
}

async function conflitos(cpf: string, matricula: string, ignorarAssociadoId?: string) {
  const campos: Record<string, string> = {};
  const porCpf = await db.query.associado.findFirst({ where: eq(schema.associado.cpf, cpf) });
  if (porCpf && porCpf.id !== ignorarAssociadoId) campos.cpf = "CPF já cadastrado";
  const porMat = await db.query.associado.findFirst({ where: eq(schema.associado.matricula, matricula) });
  if (porMat && porMat.id !== ignorarAssociadoId) campos.matricula = "Matrícula já utilizada";
  if (!ignorarAssociadoId) {
    const usr = await db.query.usuario.findFirst({ where: eq(schema.usuario.cpf, cpf) });
    if (usr && !campos.cpf) campos.cpf = "CPF já usado por outro usuário";
  }
  return Object.keys(campos).length ? { erro: "Verifique os campos destacados.", campos } : null;
}

export async function criarAssociado(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = lerDados(fd);
  if (!p.success) return errosDe(p.error);
  const d = p.data;

  const gerar = fd.get("gerarSenha") === "on";
  const senha = gerar ? gerarSenhaTemporaria() : String(fd.get("senha") ?? "");
  if (!gerar && !senhaForte(senha)) return { erro: REGRA_SENHA, campos: { senha: REGRA_SENHA } };

  const c = await conflitos(d.cpf, d.matricula);
  if (c) return c;

  const id = await db.transaction(async (tx) => {
    const [u] = await tx
      .insert(schema.usuario)
      .values({
        cpf: d.cpf,
        nome: d.nome,
        email: d.email,
        senhaHash: await hashSenha(senha),
        papel: "associado",
        deveTrocarSenha: true,
      })
      .returning({ id: schema.usuario.id });
    const [a] = await tx
      .insert(schema.associado)
      .values({ ...d, usuarioId: u.id })
      .returning({ id: schema.associado.id });
    return a.id;
  });

  const foto = fd.get("foto");
  if (foto instanceof File && foto.size > 0) await processarFoto(id, foto, null);

  await registrarAuditoria(admin.id, "criar", "associado", id, { cpf: d.cpf, matricula: d.matricula });
  revalidatePath("/admin/associados");
  // Senha gerada é exibida uma única vez no cliente (nunca na URL).
  if (gerar) return { ok: true, id, senhaGerada: senha };
  redirect(`/admin/associados/${id}?tab=propriedades`);
}

export async function atualizarAssociado(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(fd.get("id"));
  const atual = await db.query.associado.findFirst({ where: eq(schema.associado.id, id) });
  if (!atual) return { erro: "Associado não encontrado" };
  const p = lerDados(fd);
  if (!p.success) return errosDe(p.error);
  const d = p.data;

  const c = await conflitos(d.cpf, d.matricula, id);
  if (c) return c;
  if (d.cpf !== atual.cpf) {
    const outro = await db.query.usuario.findFirst({
      where: and(eq(schema.usuario.cpf, d.cpf), ne(schema.usuario.id, atual.usuarioId)),
    });
    if (outro) return { erro: "Verifique os campos destacados.", campos: { cpf: "CPF já usado por outro usuário" } };
  }

  await db.transaction(async (tx) => {
    await tx.update(schema.associado).set(d).where(eq(schema.associado.id, id));
    await tx
      .update(schema.usuario)
      .set({ cpf: d.cpf, nome: d.nome, email: d.email, ativo: d.situacao !== "inativo" })
      .where(eq(schema.usuario.id, atual.usuarioId));
  });
  await registrarAuditoria(admin.id, "atualizar", "associado", id);
  revalidatePath(`/admin/associados/${id}`);
  return { ok: true };
}

export async function salvarFoto(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(fd.get("id"));
  const a = await db.query.associado.findFirst({ where: eq(schema.associado.id, id) });
  if (!a) return { erro: "Associado não encontrado" };
  const foto = fd.get("foto");
  try {
    if (foto instanceof File && foto.size > 0) {
      await processarFoto(id, foto, a.fotoKey);
      await registrarAuditoria(admin.id, "atualizar_foto", "associado", id);
    } else if (fd.get("remover") === "1" && a.fotoKey) {
      await db.update(schema.associado).set({ fotoKey: null }).where(eq(schema.associado.id, id));
      await removerArquivo(a.fotoKey).catch(() => {});
      await registrarAuditoria(admin.id, "remover_foto", "associado", id);
    }
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha ao salvar foto" };
  }
  revalidatePath(`/admin/associados/${id}`);
  revalidatePath("/admin/associados");
  return { ok: true };
}

// ─── Propriedades ──────────────────────────────────────────────────────────

const area = z
  .string()
  .trim()
  .transform((v) => v.replace(/\./g, "").replace(",", "."))
  .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Área inválida (ex.: 18,50)");

const propSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe o nome"),
    localidade: opcional,
    car: opcional,
    canal: opcional,
    areaCadastradaHa: area,
    areaIrrigadaHa: area,
    ativa: z.boolean(),
  })
  .refine((p) => Number(p.areaIrrigadaHa) <= Number(p.areaCadastradaHa), {
    path: ["areaIrrigadaHa"],
    message: "Área irrigada não pode exceder a cadastrada",
  });

export async function salvarPropriedade(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const associadoId = String(fd.get("associadoId"));
  const propId = String(fd.get("id") ?? "");
  const p = propSchema.safeParse({
    nome: fd.get("nome") ?? "",
    localidade: fd.get("localidade") ?? "",
    car: fd.get("car") ?? "",
    canal: fd.get("canal") ?? "",
    areaCadastradaHa: fd.get("areaCadastradaHa") ?? "",
    areaIrrigadaHa: fd.get("areaIrrigadaHa") ?? "",
    ativa: fd.get("ativa") === "on",
  });
  if (!p.success) return errosDe(p.error);

  if (propId) {
    await db
      .update(schema.propriedade)
      .set(p.data)
      .where(and(eq(schema.propriedade.id, propId), eq(schema.propriedade.associadoId, associadoId)));
    await registrarAuditoria(admin.id, "atualizar", "propriedade", propId, p.data);
  } else {
    const [r] = await db
      .insert(schema.propriedade)
      .values({ ...p.data, associadoId })
      .returning({ id: schema.propriedade.id });
    await registrarAuditoria(admin.id, "criar", "propriedade", r.id, p.data);
  }
  revalidatePath(`/admin/associados/${associadoId}`);
  return { ok: true };
}

export async function removerPropriedade(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id"));
  const associadoId = String(fd.get("associadoId"));
  const temCobranca = await db.query.cobranca.findFirst({ where: eq(schema.cobranca.propriedadeId, id) });
  if (temCobranca) {
    // Com histórico de cobrança: apenas desativa.
    await db.update(schema.propriedade).set({ ativa: false }).where(eq(schema.propriedade.id, id));
  } else {
    await db.delete(schema.propriedade).where(eq(schema.propriedade.id, id));
  }
  await registrarAuditoria(admin.id, temCobranca ? "desativar" : "remover", "propriedade", id);
  revalidatePath(`/admin/associados/${associadoId}`);
}

// ─── Acesso ────────────────────────────────────────────────────────────────

export async function redefinirSenha(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const associadoId = String(fd.get("associadoId"));
  const a = await db.query.associado.findFirst({ where: eq(schema.associado.id, associadoId) });
  if (!a) return { erro: "Associado não encontrado" };

  const gerar = fd.get("gerarSenha") === "on";
  const senha = gerar ? gerarSenhaTemporaria() : String(fd.get("senha") ?? "");
  if (!gerar && !senhaForte(senha)) return { erro: REGRA_SENHA };

  await db
    .update(schema.usuario)
    .set({ senhaHash: await hashSenha(senha), deveTrocarSenha: true, tentativasFalhas: 0, bloqueadoAte: null })
    .where(eq(schema.usuario.id, a.usuarioId));
  await encerrarTodasSessoes(a.usuarioId);
  await registrarAuditoria(admin.id, "redefinir_senha", "usuario", a.usuarioId);
  revalidatePath(`/admin/associados/${associadoId}`);
  return { ok: true, senhaGerada: gerar ? senha : undefined };
}

export async function alternarAcesso(fd: FormData) {
  const admin = await requireAdmin();
  const associadoId = String(fd.get("associadoId"));
  const a = await db.query.associado.findFirst({
    where: eq(schema.associado.id, associadoId),
    with: { usuario: true },
  });
  if (!a) return;
  const ativo = !a.usuario.ativo;
  await db
    .update(schema.usuario)
    .set({ ativo, tentativasFalhas: 0, bloqueadoAte: null })
    .where(eq(schema.usuario.id, a.usuarioId));
  if (!ativo) await encerrarTodasSessoes(a.usuarioId);
  await registrarAuditoria(admin.id, ativo ? "liberar_acesso" : "bloquear_acesso", "usuario", a.usuarioId);
  revalidatePath(`/admin/associados/${associadoId}`);
}
