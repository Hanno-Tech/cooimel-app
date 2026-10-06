// Regras de cálculo da taxa de irrigação. Funções puras — sem acesso a banco.

export type CobrancaCalculo = {
  vencimento: string; // YYYY-MM-DD
  valorPrincipalCentavos: number;
  multaBp: number;
  jurosMesBp: number;
  jurosProRata: boolean;
  status: "aberta" | "paga" | "cancelada";
};

export type Encargos = {
  diasAtraso: number;
  principal: number;
  multa: number;
  juros: number;
  total: number;
};

export type StatusVisual = "paga" | "a_vencer" | "vence_hoje" | "vencida" | "cancelada";

/** área (ha, string decimal) × R$/ha (centavos) → centavos, arredondado. */
export function valorPrincipal(areaHa: string | number, valorHaCentavos: number): number {
  const centiHa = Math.round(Number(areaHa) * 100);
  return Math.round((centiHa * valorHaCentavos) / 100);
}

export function diasEntre(deISO: string, ateISO: string): number {
  const a = Date.UTC(+deISO.slice(0, 4), +deISO.slice(5, 7) - 1, +deISO.slice(8, 10));
  const b = Date.UTC(+ateISO.slice(0, 4), +ateISO.slice(5, 7) - 1, +ateISO.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

/**
 * Multa fixa (% sobre o principal) + juros simples ao mês.
 * Pro rata: juros/30 por dia de atraso. Senão: por mês iniciado.
 */
export function calcularEncargos(c: CobrancaCalculo, hoje: string): Encargos {
  const principal = c.valorPrincipalCentavos;
  const diasAtraso = Math.max(0, diasEntre(c.vencimento, hoje));
  if (c.status !== "aberta" || diasAtraso === 0) {
    return { diasAtraso, principal, multa: 0, juros: 0, total: principal };
  }
  const multa = Math.round((principal * c.multaBp) / 10_000);
  const periodos = c.jurosProRata ? diasAtraso / 30 : Math.ceil(diasAtraso / 30);
  const juros = Math.round((principal * c.jurosMesBp * periodos) / 10_000);
  return { diasAtraso, principal, multa, juros, total: principal + multa + juros };
}

export function statusVisual(
  c: Pick<CobrancaCalculo, "status" | "vencimento">,
  hoje: string,
): StatusVisual {
  if (c.status === "paga") return "paga";
  if (c.status === "cancelada") return "cancelada";
  if (c.vencimento === hoje) return "vence_hoje";
  return c.vencimento < hoje ? "vencida" : "a_vencer";
}

export type SituacaoAssociado = "REGULAR" | "EM ATRASO";

export function situacaoAssociado(
  cobrancas: Pick<CobrancaCalculo, "status" | "vencimento">[],
  hoje: string,
): SituacaoAssociado {
  return cobrancas.some((c) => statusVisual(c, hoje) === "vencida") ? "EM ATRASO" : "REGULAR";
}
