"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

export function YearSelect({ anos, ano, filtro }: { anos: number[]; ano: number; filtro: string }) {
  const router = useRouter();
  return (
    <label className="relative block">
      <span className="sr-only">Ano</span>
      <select
        value={ano}
        onChange={(e) => router.replace(`/pagamentos?filtro=${filtro}&ano=${e.target.value}`)}
        className="h-11 w-full appearance-none rounded-lg border border-black/10 bg-white px-4 text-[15px] font-medium text-ink shadow-[0_1px_3px_rgb(0_0_0/0.06)] outline-none focus:border-brand-500"
      >
        {anos.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-ink" />
    </label>
  );
}
