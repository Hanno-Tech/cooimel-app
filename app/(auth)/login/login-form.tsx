"use client";

import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useActionState, useState } from "react";
import { login } from "@/app/actions/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function mascaraCpf(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const [cpf, setCpf] = useState("");
  const [ver, setVer] = useState(false);

  return (
    <form action={action} className="space-y-3">
      <label className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-sm">
        <User className="size-6 shrink-0 text-brand-900" fill="currentColor" />
        <span className="flex flex-1 flex-col">
          <span className="text-sm font-medium text-ink">CPF</span>
          <input
            name="cpf"
            inputMode="numeric"
            autoComplete="username"
            placeholder="Digite seu CPF"
            value={cpf}
            onChange={(e) => setCpf(mascaraCpf(e.target.value))}
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
            required
          />
        </span>
      </label>

      <label className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-sm">
        <Lock className="size-6 shrink-0 text-brand-900" fill="currentColor" />
        <span className="flex flex-1 flex-col">
          <span className="text-sm font-medium text-ink">Senha</span>
          <input
            name="senha"
            type={ver ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Digite sua senha"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
            required
          />
        </span>
        <button
          type="button"
          onClick={() => setVer((v) => !v)}
          className="text-ink-muted"
          aria-label={ver ? "Ocultar senha" : "Mostrar senha"}
        >
          {ver ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </label>

      <div className="flex justify-end">
        <Dialog>
          <DialogTrigger className="text-sm text-white underline underline-offset-2">
            Esqueci minha senha
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Esqueceu sua senha?</DialogTitle>
              <DialogDescription>
                Entre em contato com a secretaria da COOIMEL. Uma nova senha provisória será
                gerada para você.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      {state?.erro && (
        <p role="alert" className="rounded-lg bg-danger-600/90 px-3 py-2 text-sm text-white">
          {state.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 h-12 w-full rounded-xl bg-brand-500 text-base font-bold tracking-wide text-white shadow-md transition hover:bg-brand-600 disabled:opacity-70"
      >
        {pending ? "ENTRANDO..." : "ENTRAR"}
      </button>
    </form>
  );
}
