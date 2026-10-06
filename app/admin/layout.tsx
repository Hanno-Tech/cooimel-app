import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { LogoIcon } from "@/components/brand/logo";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { logout } from "@/app/actions/auth";
import { requireAdmin } from "@/lib/auth/session";
import { ehMock } from "@/lib/payments";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin COOIMEL" } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const u = await requireAdmin();
  return (
    <div className="flex min-h-dvh bg-app-bg">
      <aside className="sticky top-0 flex h-dvh w-60 shrink-0 flex-col bg-brand-900 py-5">
        <div className="mb-6 flex items-center gap-2 px-6">
          <LogoIcon className="h-8 w-9" />
          <div className="leading-tight">
            <div className="text-lg font-bold text-white">COOIMEL</div>
            <div className="text-[11px] text-white/70">Painel administrativo</div>
          </div>
        </div>
        <SidebarNav papel={u.papel as "admin" | "operador"} mock={ehMock()} />
        <div className="mt-auto border-t border-white/10 px-6 pt-4">
          <div className="truncate text-sm font-medium text-white">{u.nome}</div>
          <div className="mb-3 text-xs text-white/60 capitalize">{u.papel}</div>
          <form action={logout}>
            <button className="flex items-center gap-2 text-sm text-white/80 hover:text-white">
              <LogOut className="size-4" /> Sair
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-7">{children}</main>
    </div>
  );
}
