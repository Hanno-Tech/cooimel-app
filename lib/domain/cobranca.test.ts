import { describe, expect, it } from "vitest";
import { calcularEncargos, situacaoAssociado, statusVisual, valorPrincipal } from "./cobranca";

const base = {
  vencimento: "2026-09-30",
  valorPrincipalCentavos: 208_000,
  multaBp: 1000, // 10%
  jurosMesBp: 100, // 1% a.m.
  jurosProRata: true,
  status: "aberta" as const,
};

describe("valorPrincipal", () => {
  it("16 ha × R$130 = R$2.080 (Tela 5)", () => {
    expect(valorPrincipal("16.00", 13_000)).toBe(208_000);
  });
  it("arredonda frações de hectare", () => {
    expect(valorPrincipal("18.55", 13_000)).toBe(241_150);
    expect(valorPrincipal("0.333", 100)).toBe(33);
  });
});

describe("calcularEncargos", () => {
  it("sem atraso não cobra encargos", () => {
    expect(calcularEncargos(base, "2026-09-30").total).toBe(208_000);
  });
  it("30 dias de atraso reproduz a Tela 7 (R$2.308,80)", () => {
    const e = calcularEncargos(base, "2026-10-30");
    expect(e).toMatchObject({ diasAtraso: 30, multa: 20_800, juros: 2_080, total: 230_880 });
  });
  it("pro rata: 15 dias = meio mês de juros", () => {
    expect(calcularEncargos(base, "2026-10-15").juros).toBe(1_040);
  });
  it("mês cheio: 1 dia já conta um mês", () => {
    expect(calcularEncargos({ ...base, jurosProRata: false }, "2026-10-01").juros).toBe(2_080);
  });
  it("com encargos zerados (padrão atual) total = principal", () => {
    const e = calcularEncargos({ ...base, multaBp: 0, jurosMesBp: 0 }, "2027-01-01");
    expect(e.total).toBe(208_000);
  });
  it("cobrança paga não acumula encargos", () => {
    expect(calcularEncargos({ ...base, status: "paga" }, "2027-01-01").total).toBe(208_000);
  });
});

describe("status e situação", () => {
  it("classifica por vencimento", () => {
    expect(statusVisual(base, "2026-09-29")).toBe("a_vencer");
    expect(statusVisual(base, "2026-09-30")).toBe("vence_hoje");
    expect(statusVisual(base, "2026-10-01")).toBe("vencida");
    expect(statusVisual({ ...base, status: "paga" }, "2026-12-01")).toBe("paga");
  });
  it("REGULAR com valor em aberto ainda não vencido (Tela 3)", () => {
    expect(situacaoAssociado([base], "2026-09-23")).toBe("REGULAR");
    expect(situacaoAssociado([base], "2026-10-01")).toBe("EM ATRASO");
  });
});
