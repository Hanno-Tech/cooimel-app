"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { registrarAuditoria } from "@/lib/audit";
import { db, schema } from "@/lib/db";
import { somenteDigitos } from "@/lib/format";
import {
  REGRA_SENHA,
  hashParaComparacaoFalsa,
  hashSenha,
  senhaForte,
  verificarSenha,
} from "@/lib/auth/senha";
import {
  criarSessao,
  encerrarSessao,
  encerrarTodasSessoes,
  requireUsuario,
} from "@/lib/auth/session";

export type FormState = { erro?: string } | undefined;

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MS = 15 * 60 * 1000;
const ERRO_GENERICO = "CPF ou senha inválidos.";

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const cpf = somenteDigitos(String(formData.get("cpf") ?? ""));
  const senha = String(formData.get("senha") ?? "");
  if (cpf.length !== 11 || !senha) return { erro: "Informe CPF e senha." };

  const u = await db.query.usuario.findFirst({ where: eq(schema.usuario.cpf, cpf) });
  if (!u) {
    await verificarSenha(await hashParaComparacaoFalsa(), senha);
    return { erro: ERRO_GENERICO };
  }
  if (u.bloqueadoAte && u.bloqueadoAte > new Date()) {
    return { erro: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
  }

  const ok = await verificarSenha(u.senhaHash, senha);
  if (!ok || !u.ativo) {
    const tentativas = u.tentativasFalhas + 1;
    await db
      .update(schema.usuario)
      .set({
        tentativasFalhas: tentativas >= MAX_TENTATIVAS ? 0 : tentativas,
        bloqueadoAte: tentativas >= MAX_TENTATIVAS ? new Date(Date.now() + BLOQUEIO_MS) : null,
      })
      .where(eq(schema.usuario.id, u.id));
    return { erro: ERRO_GENERICO };
  }

  await db
    .update(schema.usuario)
    .set({ tentativasFalhas: 0, bloqueadoAte: null, ultimoLoginEm: new Date() })
    .where(eq(schema.usuario.id, u.id));
  await criarSessao(u.id);

  if (u.deveTrocarSenha) redirect("/trocar-senha");
  redirect(u.papel === "associado" ? "/inicio" : "/admin");
}

export async function logout() {
  await encerrarSessao();
  redirect("/login");
}

export async function trocarSenha(_: FormState, formData: FormData): Promise<FormState> {
  const u = await requireUsuario({ permitirTrocaPendente: true });
  const atual = String(formData.get("atual") ?? "");
  const nova = String(formData.get("nova") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  if (!(await verificarSenha(u.senhaHash, atual))) return { erro: "Senha atual incorreta." };
  if (!senhaForte(nova)) return { erro: REGRA_SENHA };
  if (nova !== confirmacao) return { erro: "A confirmação não confere." };
  if (nova === atual) return { erro: "A nova senha deve ser diferente da atual." };

  await db
    .update(schema.usuario)
    .set({ senhaHash: await hashSenha(nova), deveTrocarSenha: false })
    .where(eq(schema.usuario.id, u.id));
  await encerrarTodasSessoes(u.id);
  await criarSessao(u.id);
  await registrarAuditoria(u.id, "trocar_senha", "usuario", u.id);
  redirect(u.papel === "associado" ? "/inicio" : "/admin");
}
