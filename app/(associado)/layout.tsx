import { AppShell } from "@/components/app/shell";
import { MobileFrame } from "@/components/app/mobile-frame";
import { requireAssociado } from "@/lib/auth/session";
import { contarAvisosNaoLidos } from "@/lib/services/app";

export default async function AssociadoLayout({ children }: LayoutProps<"/">) {
  const { associado } = await requireAssociado();
  const naoLidos = await contarAvisosNaoLidos(associado.id);
  return (
    <MobileFrame className="bg-app-bg">
      <AppShell naoLidos={naoLidos}>{children}</AppShell>
    </MobileFrame>
  );
}
