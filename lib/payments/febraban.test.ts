import { describe, expect, it } from "vitest";
import { brCodePix, codigoBarras, fatorVencimento, linhaDigitavel, mod10, mod11Barras } from "./febraban";

describe("febraban", () => {
  it("fator de vencimento após o reinício de 2025", () => {
    expect(fatorVencimento("2025-02-21")).toBe("9999");
    expect(fatorVencimento("2025-02-22")).toBe("1000");
  });
  it("código de barras tem 44 dígitos e DV válido", () => {
    const b = codigoBarras("133", "2026-09-30", 208_000, "1".repeat(25));
    expect(b).toHaveLength(44);
    expect(Number(b[4])).toBe(mod11Barras(b.slice(0, 4) + b.slice(5)));
  });
  it("linha digitável tem 47 dígitos e DVs dos campos", () => {
    const b = codigoBarras("133", "2026-09-30", 208_000, "1234567890123456789012345");
    const l = linhaDigitavel(b).replace(/\D/g, "");
    expect(l).toHaveLength(47);
    expect(Number(l[9])).toBe(mod10(l.slice(0, 9)));
    expect(Number(l[20])).toBe(mod10(l.slice(10, 20)));
    expect(l.slice(33)).toBe(b.slice(5, 19));
  });
  it("BR Code Pix termina com CRC de 4 hex", () => {
    const p = brCodePix({ chave: "00000000000191", valorCentavos: 208_000, nome: "COOIMEL", cidade: "Meleiro", txid: "abc" });
    expect(p).toMatch(/6304[0-9A-F]{4}$/);
    expect(p).toContain("54072080.00");
  });
});
