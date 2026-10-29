import { sql } from "drizzle-orm";
import Link from "next/link";
import { AssociadoForm } from "@/components/admin/associado-form";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";

export const metadata = { title: "Novo associado" };

export default async function NovoAssociadoPage() {
  await requireAdmin();
  // Sugere a próxima matrícula numérica (ex.: 0126). Considera só matrículas
  // puramente numéricas de até 9 dígitos — valores livres maiores estourariam o ::int.
  const [r] = await db
    .select({ max: sql<number>`coalesce(max(${schema.associado.matricula}::int), 0)`.mapWith(Number) })
    .from(schema.associado)
    .where(sql`${schema.associado.matricula} ~ '^[0-9]{1,9}$'`);
  const sugestao = String((r?.max ?? 0) + 1).padStart(4, "0");

  return (
    <>
      <Link href="/admin/associados" className="text-sm text-ink-muted hover:text-ink">
        ← Associados
      </Link>
      <PageHeader titulo="Novo associado" descricao="Depois de salvar, cadastre as propriedades." />
      <Panel className="p-8">
        <AssociadoForm sugestaoMatricula={sugestao} />
      </Panel>
    </>
  );
}
