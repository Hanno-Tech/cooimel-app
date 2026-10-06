import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/session";
import { lerArquivo } from "@/lib/storage";

// Foto privada do associado: o próprio associado ou admin/operador.
export async function GET(_: Request, ctx: RouteContext<"/fotos/[associadoId]">) {
  const { associadoId } = await ctx.params;
  const u = await usuarioAtual();
  if (!u) return new Response(null, { status: 401 });

  const a = await db.query.associado.findFirst({
    where: eq(schema.associado.id, associadoId),
    columns: { usuarioId: true, fotoKey: true },
  });
  if (!a?.fotoKey) return new Response(null, { status: 404 });
  if (u.papel === "associado" && a.usuarioId !== u.id) return new Response(null, { status: 404 });

  const arq = await lerArquivo(a.fotoKey);
  if (!arq) return new Response(null, { status: 404 });
  return new Response(arq.body as BodyInit, {
    headers: { "content-type": arq.contentType, "cache-control": "private, max-age=3600" },
  });
}
