"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { alternarAcesso, redefinirSenha, type ActionState } from "@/app/actions/admin/associados";
import { Button } from "@/components/ui/button";
import { SenhaGeradaDialog, SenhaInicialCampos } from "./associado-form";

export function Acesso({
  associadoId,
  nome,
  ativo,
  deveTrocarSenha,
  ultimoLogin,
  bloqueadoAte,
}: {
  associadoId: string;
  nome: string;
  ativo: boolean;
  deveTrocarSenha: boolean;
  ultimoLogin: string | null;
  bloqueadoAte: string | null;
}) {
  const [senha, setSenha] = useState<string | null>(null);
  const [, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const r = await redefinirSenha(prev, fd);
    if (r?.senhaGerada) setSenha(r.senhaGerada);
    else if (r?.ok) toast.success("Senha redefinida. O associado deverá trocá-la no próximo acesso.");
    if (r?.erro) toast.error(r.erro);
    return r;
  }, undefined);

  return (
    <div className="grid grid-cols-2 gap-8 p-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-brand-900">Situação do acesso</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between border-b pb-2">
            <dt className="text-ink-muted">Login (CPF)</dt>
            <dd className={ativo ? "font-medium text-brand-700" : "font-medium text-danger-600"}>
              {ativo ? "Liberado" : "Bloqueado"}
            </dd>
          </div>
          <div className="flex justify-between border-b pb-2">
            <dt className="text-ink-muted">Senha</dt>
            <dd>{deveTrocarSenha ? "Provisória (troca pendente)" : "Definida pelo associado"}</dd>
          </div>
          <div className="flex justify-between border-b pb-2">
            <dt className="text-ink-muted">Último acesso</dt>
            <dd>{ultimoLogin ?? "Nunca acessou"}</dd>
          </div>
          {bloqueadoAte && (
            <div className="flex justify-between border-b pb-2">
              <dt className="text-ink-muted">Bloqueio temporário</dt>
              <dd className="text-danger-600">até {bloqueadoAte} (tentativas erradas)</dd>
            </div>
          )}
        </dl>
        <form action={alternarAcesso}>
          <input type="hidden" name="associadoId" value={associadoId} />
          <Button variant={ativo ? "destructive" : "default"}>{ativo ? "Bloquear acesso" : "Liberar acesso"}</Button>
        </form>
      </div>

      <form action={action} className="space-y-4 rounded-xl border bg-app-bg/60 p-5">
        <input type="hidden" name="associadoId" value={associadoId} />
        <h3 className="font-semibold text-brand-900">Redefinir senha</h3>
        <p className="text-sm text-ink-muted">
          Use quando o associado esquecer a senha. As sessões abertas serão encerradas.
        </p>
        <SenhaInicialCampos />
        <Button type="submit" disabled={pending}>
          {pending ? "Redefinindo..." : "Redefinir senha"}
        </Button>
      </form>
      <SenhaGeradaDialog senha={senha} nome={nome.split(" ")[0]} onClose={() => setSenha(null)} />
    </div>
  );
}
