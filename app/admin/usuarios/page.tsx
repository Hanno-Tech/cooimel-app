import { asc, ne } from "drizzle-orm";
import { alternarUsuarioPainel } from "@/app/actions/admin/geral";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { NovoUsuario, ResetarSenha } from "@/components/admin/usuarios-acoes";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { formatCpf, formatDataHora } from "@/lib/format";

export const metadata = { title: "Usuários" };

export default async function UsuariosPage() {
  const eu = await requireAdmin(["admin"]);
  const lista = await db.query.usuario.findMany({
    where: ne(schema.usuario.papel, "associado"),
    orderBy: [asc(schema.usuario.nome)],
  });
  return (
    <>
      <PageHeader
        titulo="Usuários do painel"
        descricao="Administradores têm acesso total. Operadores não alteram configurações nem usuários."
      >
        <NovoUsuario />
      </PageHeader>
      <Panel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Último acesso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="pl-5 font-medium">
                  {u.nome} {u.id === eu.id && <span className="text-xs text-ink-muted">(você)</span>}
                </TableCell>
                <TableCell className="tabular-nums">{formatCpf(u.cpf)}</TableCell>
                <TableCell>{u.papel === "admin" ? "Administrador" : "Operador"}</TableCell>
                <TableCell>{u.ultimoLoginEm ? formatDataHora(u.ultimoLoginEm) : "—"}</TableCell>
                <TableCell>{u.ativo ? "Ativo" : <span className="text-danger-600">Bloqueado</span>}</TableCell>
                <TableCell className="space-x-2 pr-5 text-right">
                  {u.id !== eu.id && (
                    <>
                      <ResetarSenha id={u.id} nome={u.nome} />
                      <form action={alternarUsuarioPainel} className="inline">
                        <input type="hidden" name="id" value={u.id} />
                        <Button variant={u.ativo ? "destructive" : "outline"} size="sm">
                          {u.ativo ? "Bloquear" : "Liberar"}
                        </Button>
                      </form>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </>
  );
}
