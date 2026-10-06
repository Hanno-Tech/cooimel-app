"use client";

import {
  Banknote,
  FileText,
  LayoutDashboard,
  Megaphone,
  Settings,

  TestTube2,
  UserCog,
  Users,
  Wheat,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: typeof Users; exato?: boolean };

const itens: Item[] = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard, exato: true },
  { href: "/admin/associados", label: "Associados", icon: Users },
  { href: "/admin/cobrancas", label: "Cobranças", icon: FileText },
  { href: "/admin/pagamentos", label: "Pagamentos", icon: Banknote },
  { href: "/admin/avisos", label: "Avisos", icon: Megaphone },
  { href: "/admin/cotacao", label: "Cotação do Arroz", icon: Wheat },
];

const itensAdmin: Item[] = [
  { href: "/admin/usuarios", label: "Usuários", icon: UserCog },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function SidebarNav({ papel, mock }: { papel: "admin" | "operador"; mock: boolean }) {
  const pathname = usePathname();
  const ativo = (href: string, exato?: boolean) =>
    exato ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const lista: Item[] = [
    ...itens,
    ...(papel === "admin" ? itensAdmin : []),
    ...(mock ? [{ href: "/admin/simulador-banco", label: "Simulador do banco", icon: TestTube2 }] : []),
  ];

  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {lista.map(({ href, label, icon: Icon, exato }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white",
            ativo(href, exato) && "bg-brand-600 font-medium text-white hover:bg-brand-600",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

