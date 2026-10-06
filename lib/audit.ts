import "server-only";
import { db, schema } from "@/lib/db";

export async function registrarAuditoria(
  usuarioId: string | null,
  acao: string,
  entidade: string,
  entidadeId?: string | null,
  dados?: unknown,
) {
  await db.insert(schema.auditLog).values({
    usuarioId,
    acao,
    entidade,
    entidadeId: entidadeId ?? null,
    dados: dados ?? null,
  });
}
