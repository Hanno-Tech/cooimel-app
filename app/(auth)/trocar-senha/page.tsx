import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { MobileFrame } from "@/components/app/mobile-frame";
import { requireUsuario } from "@/lib/auth/session";
import { TrocarSenhaForm } from "@/components/app/trocar-senha-form";

export const metadata: Metadata = { title: "Criar nova senha" };

export default async function TrocarSenhaPage() {
  const u = await requireUsuario({ permitirTrocaPendente: true });
  return (
    <MobileFrame className="bg-brand-900 bg-[radial-gradient(ellipse_at_top,#0a5a35_0%,#013220_60%)]">
      <div className="flex flex-1 flex-col px-7 pt-14 pb-10">
        <Logo variant="light" />
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
      </div>
    </MobileFrame>
  );
}
