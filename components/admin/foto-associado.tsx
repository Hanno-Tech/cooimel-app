import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export function fotoUrl(associadoId: string, fotoKey: string | null) {
  if (!fotoKey) return null;
  return `/fotos/${associadoId}?v=${encodeURIComponent(fotoKey.split("/").pop() ?? "")}`;
}

export function FotoAssociado({
  associadoId,
  fotoKey,
  className,
}: {
  associadoId: string;
  fotoKey: string | null;
  className?: string;
}) {
  const url = fotoUrl(associadoId, fotoKey);
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-brand-700",
        className,
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- rota privada autenticada
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        <UserRound className="size-1/2" />
      )}
    </span>
  );
}
