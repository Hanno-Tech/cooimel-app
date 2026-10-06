"use client";

import { useActionState } from "react";
import { trocarSenha } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TrocarSenhaForm({ labelAtual = "Senha atual" }: { labelAtual?: string }) {
  const [state, action, pending] = useActionState(trocarSenha, undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="atual">{labelAtual}</Label>
        <Input id="atual" name="atual" type="password" autoComplete="current-password" required className="h-11" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="nova">Nova senha</Label>
        <Input id="nova" name="nova" type="password" autoComplete="new-password" required className="h-11" />
        <p className="text-xs text-ink-muted">Mínimo 8 caracteres, com letras e números.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmacao">Confirmar nova senha</Label>
        <Input id="confirmacao" name="confirmacao" type="password" autoComplete="new-password" required className="h-11" />
      </div>
      {state?.erro && <p role="alert" className="text-sm text-danger-600">{state.erro}</p>}
      <button
        disabled={pending}
        className="h-12 w-full rounded-xl bg-brand-600 font-bold tracking-wide text-white hover:bg-brand-700 disabled:opacity-70"
      >
        {pending ? "SALVANDO..." : "SALVAR SENHA"}
      </button>
    </form>
  );
}
