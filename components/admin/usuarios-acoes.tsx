"use client";

import { Plus } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { criarUsuarioPainel, resetarSenhaPainel, type Estado } from "@/app/actions/admin/geral";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SenhaGeradaDialog, SenhaInicialCampos } from "./associado-form";
import { Campo, CampoSelect } from "./campo";

export function NovoUsuario() {
  const [open, setOpen] = useState(false);
  const [senha, setSenha] = useState<string | null>(null);
  const [, action, pending] = useActionState<Estado, FormData>(async (prev, fd) => {
    const r = await criarUsuarioPainel(prev, fd);
    if (r?.ok) {
      setOpen(false);
      if (r.senhaGerada) setSenha(r.senhaGerada);
      else toast.success("Usuário criado");
    }
    if (r?.erro) toast.error(r.erro);
    return r;
  }, undefined);
  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        <Plus /> Novo usuário
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo usuário do painel</DialogTitle>
          </DialogHeader>
          <form action={action} className="space-y-4">
            <Campo name="nome" label="Nome" required />
            <div className="grid grid-cols-2 gap-4">
              <Campo name="cpf" label="CPF (login)" inputMode="numeric" required />
              <CampoSelect
                name="papel"
                label="Perfil"
                defaultValue="operador"
                opcoes={[
                  ["operador", "Operador"],
                  ["admin", "Administrador"],
                ]}
              />
            </div>
            <Campo name="email" label="E-mail" type="email" />
            <SenhaInicialCampos />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button disabled={pending}>{pending ? "Criando..." : "Criar usuário"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <SenhaGeradaDialog senha={senha} onClose={() => setSenha(null)} />
    </>
  );
}

export function ResetarSenha({ id, nome }: { id: string; nome: string }) {
  const [senha, setSenha] = useState<string | null>(null);
  const [, action, pending] = useActionState<Estado, FormData>(async (prev, fd) => {
    const r = await resetarSenhaPainel(prev, fd);
    if (r?.senhaGerada) setSenha(r.senhaGerada);
    if (r?.erro) toast.error(r.erro);
    return r;
  }, undefined);
  return (
    <>
      <form action={action} className="inline" onSubmit={(e) => !confirm(`Gerar nova senha para ${nome}?`) && e.preventDefault()}>
        <input type="hidden" name="id" value={id} />
        <Button variant="outline" size="sm" disabled={pending}>
          Nova senha
        </Button>
      </form>
      <SenhaGeradaDialog senha={senha} nome={nome.split(" ")[0]} onClose={() => setSenha(null)} />
    </>
  );
}
