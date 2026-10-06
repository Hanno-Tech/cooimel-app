import { cn } from "@/lib/utils";

// Ícone do mockup (gota + folhas). Substituir quando houver o logo oficial em vetor.
export function LogoIcon({ className, mono = false }: { className?: string; mono?: boolean }) {
  // ids iguais entre instâncias mono/colorida fariam o primeiro gradiente valer para todas
  const gid = mono ? "cooimel-gota-mono" : "cooimel-gota-cor";
  return (
    <svg viewBox="0 0 64 56" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mono ? "#ffffff" : "#7cc8f5"} />
          <stop offset="1" stopColor={mono ? "#e9f7f0" : "#1e6fc0"} />
        </linearGradient>
      </defs>
      <path d="M32 2c5 8 11 14 11 21a11 11 0 0 1-22 0c0-7 6-13 11-21z" fill={`url(#${gid})`} />
      <path
        d="M6 38c8-10 22-13 36-11 6 1 11 0 16-3-5 9-15 14-28 14-9 0-16 1-24 6z"
        fill={mono ? "#ffffff" : "#6ab42d"}
      />
      <path
        d="M10 50c10-8 24-10 38-8 4 0 8-1 11-3-5 8-14 12-26 12-8 0-15 0-23 3z"
        fill={mono ? "#d7efe1" : "#11833a"}
      />
    </svg>
  );
}

export function Logo({
  variant = "light",
  subtitle = true,
  className,
}: {
  variant?: "light" | "dark";
  subtitle?: boolean;
  className?: string;
}) {
  const light = variant === "light";
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <LogoIcon className="h-16 w-20" mono={false} />
      <span
        className={cn(
          "mt-1 text-4xl leading-none font-bold tracking-tight",
          light ? "text-white" : "text-brand-900",
        )}
      >
        COOIMEL
      </span>
      {subtitle && (
        <span className={cn("mt-1 text-sm", light ? "text-white/90" : "text-brand-700")}>
          Cooperativa de Irrigação de Meleiro
        </span>
      )}
    </div>
  );
}

export function LogoHeader({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      <LogoIcon className="h-6 w-7" mono />
      <span className="text-lg font-bold tracking-tight text-white">COOIMEL</span>
    </span>
  );
}
