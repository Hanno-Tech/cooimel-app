"use client";

import { Copy, Download, Loader2, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { consultarStatusCobranca, simularPagamento } from "@/app/actions/app";
import { cn } from "@/lib/utils";

export function CopyButton({
  text,
  label,
  className,
  doneMessage = "Copiado!",
}: {
  text: string;
  label: string;
  className?: string;
  doneMessage?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          toast.success(doneMessage);
        } catch {
          toast.error("Não foi possível copiar.");
        }
      }}
    >
      <Copy className="size-4" />
      {label}
    </button>
  );
}

export function ShareButton({
  title,
  text,
  url,
  className,
  label = "Compartilhar",
}: {
  title: string;
  text: string;
  url?: string;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        const link = url ? new URL(url, window.location.origin).toString() : undefined;
        if (navigator.share) {
          try {
            await navigator.share({ title, text, url: link });
          } catch {
            /* cancelado */
          }
          return;
        }
        await navigator.clipboard.writeText([text, link].filter(Boolean).join("\n"));
        toast.success("Copiado para a área de transferência.");
      }}
    >
      <Share2 className="size-4" />
      {label}
    </button>
  );
}

export function PrintButton({ className, label = "Baixar boleto" }: { className?: string; label?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      <Download className="size-4" />
      {label}
    </button>
  );
}

/** Tela 13: consulta o status a cada 3s e segue para a confirmação quando pago. */
export function AguardarPagamento({ cobrancaId }: { cobrancaId: string }) {
  const router = useRouter();
  useEffect(() => {
    let ativo = true;
    const t = setInterval(async () => {
      const s = await consultarStatusCobranca(cobrancaId).catch(() => null);
      if (ativo && s === "paga") {
        clearInterval(t);
        router.replace(`/pagamentos/${cobrancaId}/sucesso`);
      }
    }, 3000);
    return () => {
      ativo = false;
      clearInterval(t);
    };
  }, [cobrancaId, router]);
  return (
    <p className="flex items-center justify-center gap-2 text-xs text-ink-muted">
      <Loader2 className="size-3.5 animate-spin" /> Aguardando confirmação do pagamento…
    </p>
  );
}

export function SimularPagamentoButton({ cobrancaId, tipo }: { cobrancaId: string; tipo: "boleto" | "pix" }) {
  const [pending, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setErro(null);
            try {
              await simularPagamento(cobrancaId, tipo);
            } catch (e) {
              // redirect() lança um erro especial que o Next trata; só mostramos falhas reais
              if (e instanceof Error && !e.message.includes("NEXT_REDIRECT")) setErro(e.message);
            }
          })
        }
        className={cn(
          "flex h-10 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-warning-500/60 text-xs font-medium text-warning-500 hover:bg-warning-500/5",
        )}
      >
        {pending && <Loader2 className="size-3.5 animate-spin" />}
        Simular pagamento (ambiente de teste)
      </button>
      {erro && <p className="text-center text-xs text-danger-600">{erro}</p>}
    </div>
  );
}
