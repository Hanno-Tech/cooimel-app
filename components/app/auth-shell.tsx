import Image from "next/image";
import { Logo } from "@/components/brand/logo";

/**
 * Layout das telas de autenticação, usadas pelo app (associado) e pelo painel (admin).
 * Mobile: tela única verde (Tela 2 do mockup). Desktop: painel de marca à esquerda
 * e formulário centralizado à direita.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-brand-900 lg:grid lg:grid-cols-[1fr_minmax(440px,560px)]">
      <aside className="relative hidden overflow-hidden lg:block">
        <Image src="/img/splash.jpg" alt="" fill priority sizes="60vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900 via-brand-900/45 to-brand-900/10" />
        <div className="absolute inset-x-0 bottom-0 p-12 lg:p-16">
          <p className="max-w-md text-3xl leading-tight font-medium text-white drop-shadow lg:text-4xl">
            Gestão da sua irrigação na palma da mão.
          </p>
          <p className="mt-3 text-white/80">Cooperativa de Irrigação de Meleiro — Meleiro/SC</p>
        </div>
      </aside>

      <main className="flex min-h-dvh flex-col bg-[radial-gradient(ellipse_at_top,#0a5a35_0%,#013220_60%)] px-7 pt-16 pb-10 md:justify-center md:py-12 lg:px-12">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col md:flex-none">
          <Logo variant="light" />
          {children}
        </div>
      </main>
    </div>
  );
}
