import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { MobileFrame } from "@/components/app/mobile-frame";
import { usuarioAtual } from "@/lib/auth/session";

// Tela 1 — Abertura
export default async function Splash() {
  const u = await usuarioAtual();
  if (u) redirect(u.papel === "associado" ? "/inicio" : "/admin");

  return (
    <MobileFrame className="overflow-hidden bg-brand-900">
      <div className="absolute inset-0 bg-gradient-to-b from-[#3d6f9c] via-[#e9c79a] to-[#f2b46b]" />
      <Image
        src="/img/splash.jpg"
        alt=""
        fill
        priority
        sizes="430px"
        className="object-cover object-[50%_35%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_42%)]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/75" />

      <div className="relative z-10 flex flex-1 flex-col items-center px-8 pt-20 pb-12">
        <div className="rounded-2xl bg-white/0 px-2">
          <Logo variant="dark" className="[&_span:first-of-type]:text-5xl" />
        </div>
        <div className="flex-1" />
        <p className="text-center text-xl leading-snug font-medium text-white drop-shadow">
          Gestão da sua irrigação
          <br />
          na palma da mão.
        </p>
        <Link
          href="/login"
          className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-[#007f42] text-base font-bold tracking-wide text-white shadow-lg transition hover:bg-brand-600"
        >
          ENTRAR
        </Link>
      </div>
    </MobileFrame>
  );
}
