import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/app/auth-shell";
import { usuarioAtual } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

// Tela 2 — Login (associados e equipe do painel usam a mesma tela)
export default async function LoginPage() {
  const u = await usuarioAtual();
  if (u && !u.deveTrocarSenha) redirect(u.papel === "associado" ? "/inicio" : "/admin");

  return (
    <AuthShell>
      <h1 className="mt-12 mb-4 text-xl font-medium text-white lg:mt-10">
        <span className="lg:hidden">Login do Associado</span>
        <span className="hidden lg:inline">Acesse sua conta</span>
      </h1>
      <LoginForm />
      <div className="flex-1 md:hidden" />
      <p className="mt-10 text-center text-sm text-white/85">
        Ainda não é cadastrado?
        <br />
        Entre em contato com a COOIMEL.
      </p>
    </AuthShell>
  );
}
