import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/lib/db";

export const COOKIE_SESSAO = "cooimel_sessao";
const DURACAO_MS = 30 * 24 * 60 * 60 * 1000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function criarSessao(usuarioId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiraEm = new Date(Date.now() + DURACAO_MS);
  await db.insert(schema.sessao).values({ id: hashToken(token), usuarioId, expiraEm });
  (await cookies()).set(COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiraEm,
  });
}

export async function encerrarSessao() {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value;
  if (token) await db.delete(schema.sessao).where(eq(schema.sessao.id, hashToken(token)));
  jar.delete(COOKIE_SESSAO);
}

export async function encerrarTodasSessoes(usuarioId: string) {
  await db.delete(schema.sessao).where(eq(schema.sessao.usuarioId, usuarioId));
}

/** Usuário logado (ou null). Memoizado por request. */
export const usuarioAtual = cache(async () => {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ usuario: schema.usuario })
    .from(schema.sessao)
    .innerJoin(schema.usuario, eq(schema.usuario.id, schema.sessao.usuarioId))
    .where(and(eq(schema.sessao.id, hashToken(token)), gt(schema.sessao.expiraEm, new Date())))
    .limit(1);
  if (!row || !row.usuario.ativo) return null;
  return row.usuario;
});

export type Usuario = NonNullable<Awaited<ReturnType<typeof usuarioAtual>>>;

/** Exige login. Força troca de senha no 1º acesso. */
export async function requireUsuario(opts: { permitirTrocaPendente?: boolean } = {}) {
  const u = await usuarioAtual();
  if (!u) redirect("/login");
  if (u.deveTrocarSenha && !opts.permitirTrocaPendente) redirect("/trocar-senha");
  return u;
}

/** Associado logado + seu cadastro. Admin/operador são enviados ao painel. */
export const requireAssociado = cache(async () => {
  const u = await requireUsuario();
  if (u.papel !== "associado") redirect("/admin");
  const associado = await db.query.associado.findFirst({
    where: eq(schema.associado.usuarioId, u.id),
  });
  if (!associado) redirect("/login");
  return { usuario: u, associado };
});

export async function requireAdmin(papeis: ("admin" | "operador")[] = ["admin", "operador"]) {
  const u = await requireUsuario();
  if (u.papel === "associado") redirect("/inicio");
  if (!papeis.includes(u.papel)) redirect("/admin");
  return u;
}
