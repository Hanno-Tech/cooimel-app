import { CircleAlert, CircleCheck, Clock3, Droplet } from "lucide-react";
import Link from "next/link";
import type { StatusVisual } from "@/lib/domain/cobranca";
import { formatCompetencia, formatData } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Contêiner das telas. Mobile: coluna com respiro de 12px. Desktop (lg): centralizado,
 * `largura="ampla"` (padrão, listas e grades) ou `"estreita"` (formulários/detalhes).
 */
export function Page({
  children,
  className,
  largura = "ampla",
}: {
  children: React.ReactNode;
  className?: string;
  largura?: "ampla" | "estreita";
}) {
  return (
    <main
      className={cn(
        "flex flex-1 flex-col gap-3 p-3 lg:mx-auto lg:w-full lg:max-w-5xl lg:gap-5 lg:px-8 lg:py-8",
        // estreita: blocos limitados, alinhados à esquerda com o título do header
        largura === "estreita" && "lg:[&>*]:w-full lg:[&>*]:max-w-2xl",
        className,
      )}
    >
      {children}
    </main>
  );
}

export function AppCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-black/[0.04] bg-white shadow-[0_1px_4px_rgb(0_0_0/0.08)]", className)}>
      {children}
    </div>
  );
}

/** Linha chave/valor dos detalhes (Telas 5, 7, 10, 14). */
export function Row({
  label,
  value,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 py-1.5 text-sm", className)}>
      <span className="text-ink">{label}</span>
      <span className="text-right text-ink">{value}</span>
    </div>
  );
}

export function StatusIcon({ status, className }: { status: StatusVisual; className?: string }) {
  if (status === "paga") return <CircleCheck className={cn("size-7 fill-brand-500 text-white", className)} />;
  if (status === "vencida") return <CircleAlert className={cn("size-7 fill-danger-600 text-white", className)} />;
  return <Clock3 className={cn("size-7 text-warning-500", className)} strokeWidth={2.2} />;
}

export const STATUS_LABEL: Record<StatusVisual, string> = {
  paga: "Pago",
  a_vencer: "Em aberto",
  vence_hoje: "Vence hoje",
  vencida: "Em atraso",
  cancelada: "Cancelada",
};

export function statusCor(s: StatusVisual) {
  return s === "paga" ? "text-brand-500" : s === "vencida" ? "text-danger-600" : "text-warning-500";
}

/** Gota + título + competência + vencimento (Telas 5, 7). */
export function ChargeSummary({
  descricao,
  competencia,
  vencimento,
  propriedade,
  className,
}: {
  descricao: string;
  competencia: string;
  vencimento: string;
  propriedade?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4 p-4", className)}>
      <Droplet className="size-11 shrink-0 fill-info-500 text-info-500" />
      <div className="text-sm leading-relaxed">
        <p className="text-base font-medium text-ink">{descricao}</p>
        {propriedade && <p className="text-ink-muted">{propriedade}</p>}
        <p className="text-ink-muted">Competência: {formatCompetencia(competencia)}</p>
        <p className="font-medium text-ink">Vencimento: {formatData(vencimento)}</p>
      </div>
    </div>
  );
}

const btn = "flex h-12 w-full items-center justify-center gap-2.5 rounded-lg text-[15px] font-bold transition";

export const botao = {
  primario: cn(btn, "bg-brand-600 text-white shadow-sm hover:bg-brand-700"),
  perigo: cn(btn, "bg-danger-600 text-white shadow-sm hover:brightness-95"),
  contorno: cn(btn, "border-2 border-brand-600/25 bg-white text-brand-600 hover:bg-brand-50"),
  suave: cn(btn, "border border-brand-600/30 bg-brand-50 text-brand-700 hover:brightness-[0.98]"),
  pequeno: cn(
    "flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-black/10 bg-white text-xs font-medium text-ink hover:bg-gray-50",
  ),
  neutro: cn(btn, "border border-black/10 bg-white font-medium text-ink hover:bg-gray-50"),
};

export function LinkBotao({
  href,
  variant = "primario",
  children,
  className,
}: {
  href: string;
  variant?: keyof typeof botao;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(botao[variant], className)}>
      {children}
    </Link>
  );
}

/** Abas segmentadas por link (Telas 4 e 11). */
export function SegmentedTabs({
  items,
  ativo,
}: {
  items: { value: string; label: string; href: string }[];
  ativo: string;
}) {
  return (
    <div className="flex rounded-lg bg-[#eef1ef] p-1">
      {items.map((i) => (
        <Link
          key={i.value}
          href={i.href}
          replace
          className={cn(
            "flex-1 rounded-md py-2 text-center text-sm transition",
            i.value === ativo ? "bg-brand-700 font-medium text-white shadow" : "text-ink",
          )}
        >
          {i.label}
        </Link>
      ))}
    </div>
  );
}

/** Ícone do Pix (losango de quatro pétalas). */
export function PixIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 1.5 7.3 6.2l2.4 2.4L12 6.3l2.3 2.3 2.4-2.4L12 1.5Zm-5.8 5.8L1.5 12l4.7 4.7 2.4-2.4L6.3 12l2.3-2.3-2.4-2.4Zm11.6 0-2.4 2.4 2.3 2.3-2.3 2.3 2.4 2.4 4.7-4.7-4.7-4.7ZM12 9.8 9.8 12l2.2 2.2 2.2-2.2L12 9.8Zm-2.3 5.6-2.4 2.4 4.7 4.7 4.7-4.7-2.4-2.4-2.3 2.3-2.3-2.3Z"
      />
    </svg>
  );
}

export function EmptyState({ icon, title, text }: { icon: React.ReactNode; title: string; text?: string }) {
  return (
    <AppCard className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <div className="text-brand-500">{icon}</div>
      <p className="font-medium text-ink">{title}</p>
      {text && <p className="text-sm text-ink-muted">{text}</p>}
    </AppCard>
  );
}
