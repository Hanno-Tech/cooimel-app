import type { Metadata } from "next";
import { AuthShell } from "@/components/app/auth-shell";
import { TrocarSenhaForm } from "@/components/app/trocar-senha-form";
import { requireUsuario } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Criar nova senha" };

export default async function TrocarSenhaPage() {
  const u = await requireUsuario({ permitirTrocaPendente: true });
  return (
    <AuthShell>
      <h1 className="mt-10 text-xl font-medium text-white">
        {u.deveTrocarSenha ? "Primeiro acesso" : "Alterar senha"}
      </h1>
      <p className="mt-1 mb-5 text-sm text-white/80">
        {u.deveTrocarSenha
          ? `Olá, ${u.nome.split(" ")[0]}! Crie uma senha pessoal para continuar.`
          : "Informe a senha atual e a nova senha."}
      </p>
      <div className="rounded-2xl bg-white p-5">
        <TrocarSenhaForm labelAtual={u.deveTrocarSenha ? "Senha provisória" : "Senha atual"} />
      </div>
    </AuthShell>
  );
}
