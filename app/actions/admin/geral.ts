"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { registrarAuditoria } from "@/lib/audit";
import { REGRA_SENHA, gerarSenhaTemporaria, hashSenha, senhaForte } from "@/lib/auth/senha";
import { encerrarTodasSessoes, requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { cpfValido, somenteDigitos } from "@/lib/format";
import { parseMoeda, parsePercentual } from "@/lib/parse";

export type Estado = { ok?: boolean; erro?: string; senhaGerada?: string } | undefined;

// ─── Configurações (somente admin) ─────────────────────────────────────────

export async function salvarConfiguracao(_: Estado, fd: FormData): Promise<Estado> {
  const admin = await requireAdmin(["admin"]);
  const valorHa = parseMoeda(fd.get("valorHa"));
  const multa = parsePercentual(fd.get("multa"));
  const juros = parsePercentual(fd.get("juros"));
  const dia = Number(fd.get("diaVencimentoPadrao"));
  if (valorHa === null) return { erro: "Valor por hectare inválido" };
  if (multa === null || juros === null) return { erro: "Percentual inválido" };
  if (!(dia >= 1 && dia <= 31)) return { erro: "Dia de vencimento deve estar entre 1 e 31" };

  const dados = {
    valorHaCentavos: valorHa,
    multaBp: multa,
    jurosMesBp: juros,
    jurosProRata: fd.get("jurosProRata") === "on",
    diaVencimentoPadrao: dia,
    coopNome: String(fd.get("coopNome") ?? "").trim() || "Cooperativa de Irrigação de Meleiro",
    coopCnpj: String(fd.get("coopCnpj") ?? "").trim() || null,
    coopTelefone: String(fd.get("coopTelefone") ?? "").trim() || null,
    coopEndereco: String(fd.get("coopEndereco") ?? "").trim() || null,
  };
  await db
    .insert(schema.configuracao)
    .values({ id: 1, ...dados })
    .onConflictDoUpdate({ target: schema.configuracao.id, set: dados });
  await registrarAuditoria(admin.id, "atualizar", "configuracao", "1", dados);
  revalidatePath("/admin/configuracoes");
  return { ok: true };
}

// ─── Cotação ───────────────────────────────────────────────────────────────

export async function lancarCotacao(_: Estado, fd: FormData): Promise<Estado> {
  const admin = await requireAdmin();
  const valor = parseMoeda(fd.get("valor"));
  const ref = String(fd.get("referenciaEm") ?? "");
  if (!valor) return { erro: "Informe o valor da saca" };
  const referenciaEm = ref ? new Date(`${ref}:00-03:00`) : new Date();
  if (Number.isNaN(referenciaEm.getTime())) return { erro: "Data inválida" };

  const [r] = await db
    .insert(schema.cotacao)
    .values({
      produto: String(fd.get("produto") || "Arroz em casca"),
      regiao: String(fd.get("regiao") || "Santa Catarina"),
      unidade: String(fd.get("unidade") || "Saca de 50 kg"),
      fonte: String(fd.get("fonte") || "CEPA/SC"),
      valorCentavos: valor,
      referenciaEm,
      lancadoPor: admin.id,
    })
    .returning({ id: schema.cotacao.id });
  await registrarAuditoria(admin.id, "lancar", "cotacao", r.id, { valor });
  revalidatePath("/admin/cotacao");
  revalidatePath("/cotacao");
  return { ok: true };
}

export async function removerCotacao(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id"));
  await db.delete(schema.cotacao).where(eq(schema.cotacao.id, id));
  await registrarAuditoria(admin.id, "remover", "cotacao", id);
  revalidatePath("/admin/cotacao");
}

// ─── Avisos ────────────────────────────────────────────────────────────────

const avisoSchema = z.object({
  tipo: z.enum(["manutencao", "assembleia", "orientacao"]),
  titulo: z.string().trim().min(3, "Informe o título"),
  resumo: z.string().trim().min(3, "Informe o resumo").max(200, "Resumo: até 200 caracteres"),
  corpo: z.string().trim(),
  dataEvento: z.string(),
  local: z.string().trim(),
  publicar: z.boolean(),
});

const dt = (v: string) => (v ? new Date(`${v}:00-03:00`) : null);

export async function salvarAviso(_: Estado, fd: FormData): Promise<Estado> {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const p = avisoSchema.safeParse({
    tipo: fd.get("tipo"),
    titulo: fd.get("titulo") ?? "",
    resumo: fd.get("resumo") ?? "",
    corpo: fd.get("corpo") ?? "",
    dataEvento: fd.get("dataEvento") ?? "",
    local: fd.get("local") ?? "",
    publicar: fd.get("publicar") === "on",
  });
  if (!p.success) return { erro: p.error.issues[0].message };
  const d = p.data;

  const atual = id ? await db.query.aviso.findFirst({ where: eq(schema.aviso.id, id) }) : null;
  const valores = {
    tipo: d.tipo,
    titulo: d.titulo,
    resumo: d.resumo,
    corpo: d.corpo || null,
    dataEvento: dt(d.dataEvento),
    local: d.local || null,
    publicadoEm: d.publicar ? (atual?.publicadoEm ?? new Date()) : null,
  };
  if (atual) {
    await db.update(schema.aviso).set(valores).where(eq(schema.aviso.id, id));
    await registrarAuditoria(admin.id, "atualizar", "aviso", id);
  } else {
    const [r] = await db
      .insert(schema.aviso)
      .values({ ...valores, criadoPor: admin.id })
      .returning({ id: schema.aviso.id });
    await registrarAuditoria(admin.id, "criar", "aviso", r.id);
  }
  revalidatePath("/admin/avisos");
  revalidatePath("/avisos");
  return { ok: true };
}

export async function removerAviso(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id"));
  await db.delete(schema.aviso).where(eq(schema.aviso.id, id));
  await registrarAuditoria(admin.id, "remover", "aviso", id);
  revalidatePath("/admin/avisos");
}

// ─── Usuários do painel (somente admin) ────────────────────────────────────

export async function criarUsuarioPainel(_: Estado, fd: FormData): Promise<Estado> {
  const admin = await requireAdmin(["admin"]);
  const cpf = somenteDigitos(String(fd.get("cpf") ?? ""));
  const nome = String(fd.get("nome") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim() || null;
  const papel = fd.get("papel") === "admin" ? "admin" : "operador";
  if (!cpfValido(cpf)) return { erro: "CPF inválido" };
  if (nome.length < 3) return { erro: "Informe o nome" };
  if (await db.query.usuario.findFirst({ where: eq(schema.usuario.cpf, cpf) })) {
    return { erro: "Já existe um usuário com este CPF" };
  }
  const gerar = fd.get("gerarSenha") === "on";
  const senha = gerar ? gerarSenhaTemporaria(10) : String(fd.get("senha") ?? "");
  if (!gerar && !senhaForte(senha)) return { erro: REGRA_SENHA };

  const [u] = await db
    .insert(schema.usuario)
    .values({ cpf, nome, email, papel, senhaHash: await hashSenha(senha), deveTrocarSenha: true })
    .returning({ id: schema.usuario.id });
  await registrarAuditoria(admin.id, "criar", "usuario", u.id, { papel });
  revalidatePath("/admin/usuarios");
  return { ok: true, senhaGerada: gerar ? senha : undefined };
}

export async function alternarUsuarioPainel(fd: FormData) {
  const admin = await requireAdmin(["admin"]);
  const id = String(fd.get("id"));
  if (id === admin.id) return; // não bloquear a si mesmo
  const u = await db.query.usuario.findFirst({ where: eq(schema.usuario.id, id) });
  if (!u || u.papel === "associado") return;
  await db.update(schema.usuario).set({ ativo: !u.ativo }).where(eq(schema.usuario.id, id));
  if (u.ativo) await encerrarTodasSessoes(id);
  await registrarAuditoria(admin.id, u.ativo ? "bloquear" : "liberar", "usuario", id);
  revalidatePath("/admin/usuarios");
}

export async function resetarSenhaPainel(_: Estado, fd: FormData): Promise<Estado> {
  const admin = await requireAdmin(["admin"]);
  const id = String(fd.get("id"));
  const u = await db.query.usuario.findFirst({ where: eq(schema.usuario.id, id) });
  if (!u || u.papel === "associado") return { erro: "Usuário não encontrado" };
  const senha = gerarSenhaTemporaria(10);
  await db
    .update(schema.usuario)
    .set({ senhaHash: await hashSenha(senha), deveTrocarSenha: true, tentativasFalhas: 0, bloqueadoAte: null })
    .where(eq(schema.usuario.id, id));
  await encerrarTodasSessoes(id);
  await registrarAuditoria(admin.id, "redefinir_senha", "usuario", id);
  return { ok: true, senhaGerada: senha };
}
