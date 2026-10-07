import { AppShell } from "@/components/app/shell";
import { MobileFrame } from "@/components/app/mobile-frame";
import { requireAssociado } from "@/lib/auth/session";
import { contarAvisosNaoLidos } from "@/lib/services/app";

export default async function AssociadoLayout({ children }: LayoutProps<"/">) {
  const { associado } = await requireAssociado();
  const naoLidos = await contarAvisosNaoLidos(associado.id);
  const fotoUrl = associado.fotoKey ? `/fotos/${associado.id}?v=${associado.fotoKey.split("/").pop()}` : null;
  return (
    <MobileFrame desktop className="bg-app-bg">
      <AppShell
        naoLidos={naoLidos}
        associado={{ nome: associado.nome, matricula: associado.matricula, fotoUrl }}
      >
        {children}
      </AppShell>
    </MobileFrame>
  );
}
