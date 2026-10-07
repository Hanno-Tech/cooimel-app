"use client";

import {
  Bell,
  ArrowLeft,
  CircleUserRound,
  Ellipsis,
  FileText,
  Files,
  Home,
  LogOut,
  Megaphone,
  Menu,
  ScanBarcode,
  Settings,
  Wheat,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useState } from "react";
import { logout } from "@/app/actions/auth";
import { LogoHeader, LogoIcon } from "@/components/brand/logo";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type AssociadoResumo = { nome: string; matricula: string; fotoUrl: string | null };
type ShellCtx = { abrirMenu: () => void; naoLidos: number };
const Ctx = createContext<ShellCtx>({ abrirMenu: () => {}, naoLidos: 0 });

const MENU = [
  { href: "/inicio", label: "Início", icon: Home },
  { href: "/pagamentos", label: "Pagamentos", icon: FileText },
  { href: "/boletos", label: "Boletos", icon: Files },
  { href: "/cotacao", label: "Cotação do Arroz", icon: Wheat },
  { href: "/avisos", label: "Avisos", icon: Megaphone },
  { href: "/cadastro", label: "Meu Cadastro", icon: CircleUserRound },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

const NAV = [
  { href: "/inicio", label: "Início", icon: Home },
  { href: "/pagamentos", label: "Pagamentos", icon: Files },
  { href: "/boletos", label: "Boletos", icon: ScanBarcode },
  { href: "/cotacao", label: "Arroz", icon: Wheat },
];

// Rotas de detalhe/fluxo de pagamento não mostram a barra inferior (como no mockup).
const SEM_NAV = /^\/pagamentos\/[^/]+/;

export function AppShell({
  children,
  naoLidos,
  associado,
}: {
  children: React.ReactNode;
  naoLidos: number;
  associado: AssociadoResumo;
}) {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();
  const mostrarNav = !SEM_NAV.test(pathname);

  return (
    <Ctx value={{ abrirMenu: () => setAberto(true), naoLidos }}>
      <SideNav pathname={pathname} associado={associado} naoLidos={naoLidos} />
      <div className={cn("flex flex-1 flex-col bg-app-bg lg:pl-64 print:pl-0", mostrarNav && "pb-16 lg:pb-0")}>
        {children}
      </div>
      {mostrarNav && <BottomNav pathname={pathname} onMais={() => setAberto(true)} />}
      <Sheet open={aberto} onOpenChange={setAberto}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[78%] max-w-[330px] gap-0 border-0 p-0 data-[side=left]:left-[max(0px,calc(50%-215px))] sm:max-w-[330px]"
        >
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="flex items-center gap-2 border-b px-5 pt-8 pb-4">
            <LogoIcon className="h-9 w-11" />
            <span className="text-xl font-bold text-brand-900">COOIMEL</span>
          </div>
          <nav className="flex flex-col py-2">
            {MENU.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setAberto(false)}
                className={cn(
                  "flex items-center gap-4 px-5 py-3 text-[15px] text-ink hover:bg-brand-50",
                  pathname.startsWith(href) && "bg-brand-50 font-medium text-brand-700",
                )}
              >
                <Icon className="size-5 text-brand-900" />
                {label}
              </Link>
            ))}
            <form action={logout}>
              <button className="flex w-full items-center gap-4 px-5 py-3 text-[15px] text-ink hover:bg-brand-50">
                <LogOut className="size-5 text-brand-900" />
                Sair
              </button>
            </form>
          </nav>
        </SheetContent>
      </Sheet>
    </Ctx>
  );
}

/** Menu lateral fixo no notebook/desktop (substitui barra inferior + drawer). */
function SideNav({
  pathname,
  associado,
  naoLidos,
}: {
  pathname: string;
  associado: AssociadoResumo;
  naoLidos: number;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-brand-900 text-white lg:flex print:hidden">
      <Link href="/inicio" className="flex items-center gap-2 px-6 pt-6 pb-5">
        <LogoIcon className="h-9 w-11" />
        <span className="text-xl font-bold tracking-tight">COOIMEL</span>
      </Link>
      <Link
        href="/cadastro"
        className="mx-3 mb-4 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3 hover:bg-white/10"
      >
        {associado.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- rota privada autenticada
          <img src={associado.fotoUrl} alt="" className="size-10 rounded-full object-cover ring-2 ring-white/20" />
        ) : (
          <CircleUserRound className="size-10 text-white/80" strokeWidth={1.4} />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{associado.nome}</p>
          <p className="text-xs text-white/60">Matrícula {associado.matricula}</p>
        </div>
      </Link>
      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {MENU.map(({ href, label, icon: Icon }) => {
          const ativo = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/10 hover:text-white",
                ativo && "bg-brand-600 font-medium text-white hover:bg-brand-600",
              )}
            >
              <Icon className="size-[18px]" />
              <span className="flex-1">{label}</span>
              {href === "/avisos" && naoLidos > 0 && (
                <span className="rounded-full bg-danger-600 px-1.5 text-[11px] leading-5 font-bold">
                  {naoLidos > 9 ? "9+" : naoLidos}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <form action={logout} className="border-t border-white/10 px-3 py-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white">
          <LogOut className="size-[18px]" /> Sair
        </button>
      </form>
    </aside>
  );
}

function BottomNav({ pathname, onMais }: { pathname: string; onMais: () => void }) {
  const item = "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px]";
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 flex h-16 w-full max-w-[430px] -translate-x-1/2 border-t bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      {NAV.map(({ href, label, icon: Icon }) => {
        const ativo = pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={cn(item, ativo ? "font-medium text-brand-700" : "text-ink-muted")}>
            <Icon className="size-5" strokeWidth={ativo ? 2.4 : 1.8} />
            {label}
          </Link>
        );
      })}
      <button type="button" onClick={onMais} className={cn(item, "text-ink-muted")}>
        <Ellipsis className="size-5" />
        Mais
      </button>
    </nav>
  );
}

/**
 * Header verde. Sem `back`: hambúrguer + logo + sino (Tela 3). Com `back`: seta + título.
 * No desktop (lg) o menu lateral assume a navegação: some o hambúrguer/logo, o título
 * aparece sempre e a seta só fica em telas de detalhe (não nas que voltam ao início).
 */
export function AppHeader({ title, back }: { title?: string; back?: string | true }) {
  const { abrirMenu, naoLidos } = use(Ctx);
  const router = useRouter();
  const iconBtn = "flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10";

  return (
    <header className="sticky top-0 z-30 bg-brand-900 text-white shadow-sm print:hidden">
      <div className="flex h-14 items-center gap-3 px-3 lg:mx-auto lg:h-16 lg:max-w-5xl lg:px-8">
        {back ? (
          <button
            type="button"
            aria-label="Voltar"
            onClick={() => (back === true ? router.back() : router.push(back))}
            className={cn(iconBtn, back === "/inicio" && "lg:hidden", "lg:-ml-2")}
          >
            <ArrowLeft className="size-6" />
          </button>
        ) : (
          <button type="button" aria-label="Abrir menu" onClick={abrirMenu} className={cn(iconBtn, "lg:hidden")}>
            <Menu className="size-6" />
          </button>
        )}
        {title ? (
          <h1 className="flex-1 truncate text-lg font-medium lg:text-xl">{title}</h1>
        ) : (
          <>
            <div className="flex flex-1 justify-center lg:hidden">
              <LogoHeader />
            </div>
            <h1 className="hidden flex-1 text-xl font-medium lg:block">Início</h1>
          </>
        )}
        <Link
          href="/avisos"
          aria-label="Avisos"
          className={cn("relative", iconBtn, title && "hidden lg:flex")}
        >
          <Bell className="size-6" />
          {naoLidos > 0 && (
            <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-danger-600 px-1 text-[10px] leading-4 font-bold">
              {naoLidos > 9 ? "9+" : naoLidos}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
