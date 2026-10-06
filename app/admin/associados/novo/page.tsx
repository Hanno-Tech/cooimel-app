import { sql } from "drizzle-orm";
import Link from "next/link";
import { AssociadoForm } from "@/components/admin/associado-form";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";

export const metadata = { title: "Novo associado" };

export default async function NovoAssociadoPage() {
  await requireAdmin();
  // Sugere a próxima matrícula numérica (ex.: 0126).
  const [r] = await db
    .select({ max: sql<number>`coalesce(max(nullif(regexp_replace(${schema.associado.matricula}, '\\D', '', 'g'), '')::int), 0)`.mapWith(Number) })
    .from(schema.associado);
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
