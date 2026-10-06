const TZ = "America/Sao_Paulo";

export function formatMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatHa(ha: string | number): string {
  return `${Number(ha).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha`;
}

export function somenteDigitos(v: string): string {
  return v.replace(/\D/g, "");
}

export function formatCpf(cpf: string): string {
  const d = somenteDigitos(cpf).padStart(11, "0");
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Mascarado como na Tela 10: ***.***.***-** com só os 3 do meio visíveis. */
export function mascararCpf(cpf: string): string {
  const d = somenteDigitos(cpf).padStart(11, "0");
  return `***.${d.slice(3, 6)}.***-**`;
}

export function formatTelefone(tel: string | null | undefined): string {
  if (!tel) return "—";
  const d = somenteDigitos(tel);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return tel;
}

/** 'YYYY-MM-DD' → 'DD/MM/YYYY' sem passar por Date (evita erro de fuso). */
export function formatData(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function formatDataHora(dt: Date | string): string {
  const d = typeof dt === "string" ? new Date(dt) : dt;
  return d.toLocaleString("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).replace(",", " -");
}

/** 'YYYY-MM' → 'MM/YYYY' */
export function formatCompetencia(c: string): string {
  const [y, m] = c.split("-");
  return `${m}/${y}`;
}

/** Data de hoje (YYYY-MM-DD) no fuso de Meleiro/SC. */
export function hojeISO(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: TZ });
}

export function cpfValido(cpf: string): boolean {
  const d = somenteDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let s = 0;
    for (let i = 0; i < len; i++) s += Number(d[i]) * (len + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}
