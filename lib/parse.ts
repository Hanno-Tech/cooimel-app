/** "2.080,50" | "2080.5" | "130" → centavos. null se inválido. */
export function parseMoeda(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim().replace(/[R$\s]/g, "");
  if (!s) return null;
  const norm = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  if (!/^\d+(\.\d{1,2})?$/.test(norm)) return null;
  return Math.round(Number(norm) * 100);
}

/** "10" | "2,5" (%) → basis points. */
export function parsePercentual(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim().replace("%", "").replace(",", ".");
  if (s === "") return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

export const centavosParaInput = (c: number) =>
  (c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const bpParaInput = (bp: number) =>
  (bp / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
