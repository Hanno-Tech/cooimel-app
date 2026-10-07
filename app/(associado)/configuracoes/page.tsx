import { ChevronRight, KeyRound, LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { AppHeader } from "@/components/app/shell";
import { AppCard, Page } from "@/components/app/ui";
import { requireAssociado } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  await requireAssociado();
  return (
    <>
      <AppHeader title="Configurações" back="/inicio" />
      <Page largura="estreita">
        <AppCard className="divide-y divide-black/5">
          <Link href="/trocar-senha" className="flex items-center gap-4 px-4 py-4 text-[15px] text-ink hover:bg-gray-50">
            <KeyRound className="size-5 text-brand-900" />
            <span className="flex-1">Alterar senha</span>
            <ChevronRight className="size-4 text-ink-muted" />
          </Link>
          <form action={logout}>
            <button className="flex w-full items-center gap-4 px-4 py-4 text-[15px] text-danger-600 hover:bg-gray-50">
              <LogOut className="size-5" />
              Sair
            </button>
          </form>
        </AppCard>
        <p className="text-center text-xs text-ink-muted lg:text-left">COOIMEL · Cooperativa de Irrigação de Meleiro</p>
      </Page>
    </>
  );
}
