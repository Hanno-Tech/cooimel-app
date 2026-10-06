import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { MobileFrame } from "@/components/app/mobile-frame";
import { usuarioAtual } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

// Tela 2 — Login do Associado
export default async function LoginPage() {
  const u = await usuarioAtual();
  if (u && !u.deveTrocarSenha) redirect(u.papel === "associado" ? "/inicio" : "/admin");

  return (
    <MobileFrame className="bg-brand-900 bg-[radial-gradient(ellipse_at_top,#0a5a35_0%,#013220_60%)]">
      <div className="flex flex-1 flex-col px-7 pt-16 pb-10">
        <Logo variant="light" />
        <h1 className="mt-12 mb-4 text-xl font-medium text-white">Login do Associado</h1>
        <LoginForm />
        <div className="flex-1" />
        <p className="mt-10 text-center text-sm text-white/85">
          Ainda não é cadastrado?
          <br />
          Entre em contato com a COOIMEL.
        </p>
      </div>
    </MobileFrame>
  );
}
