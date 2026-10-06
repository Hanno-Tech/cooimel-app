import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { brCodePix, codigoBarras, linhaDigitavel } from "./febraban";
import type { CobrancaInput, PagamentoEvento, PaymentGateway } from "./gateway";

// Banco simulado. Gera dados com formato real; o pagamento é disparado pelo
// "Simulador do banco" no admin (ou pelo botão de teste nas telas de pagamento).

const BANCO_CRESOL = "133";
const segredo = () => process.env.MOCK_WEBHOOK_SECRET ?? "dev-mock-secret";

export function assinarMock(body: string) {
  return createHmac("sha256", segredo()).update(body).digest("hex");
}

function campoLivre(ref: string) {
  const digitos = BigInt("0x" + ref.replace(/-/g, "").slice(0, 20)).toString();
  return digitos.padStart(25, "0").slice(-25);
}

export const mockGateway: PaymentGateway = {
  nome: "mock",

  async criarBoleto(c: CobrancaInput) {
    const providerRef = `mock-bol-${randomUUID()}`;
    const barras = codigoBarras(BANCO_CRESOL, c.vencimento, c.valorCentavos, campoLivre(providerRef.slice(9)));
    return {
      providerRef,
      codigoBarras: barras,
      linhaDigitavel: linhaDigitavel(barras),
      expiraEm: null,
    };
  },

  async criarPix(c: CobrancaInput) {
    const providerRef = `mock-pix-${randomUUID()}`;
    return {
      providerRef,
      copiaCola: brCodePix({
        chave: "00000000000191",
        valorCentavos: c.valorCentavos,
        nome: "COOIMEL",
        cidade: "MELEIRO",
        txid: providerRef.replace(/[^a-zA-Z0-9]/g, "").slice(-25),
      }),
      expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  },

  async cancelar() {},

  async parseWebhook(body: string, headers: Headers): Promise<PagamentoEvento> {
    const assinatura = headers.get("x-mock-signature") ?? "";
    const esperada = assinarMock(body);
    if (
      assinatura.length !== esperada.length ||
      !timingSafeEqual(Buffer.from(assinatura), Buffer.from(esperada))
    ) {
      throw new Error("assinatura inválida");
    }
    const e = JSON.parse(body);
    return {
      eventId: String(e.eventId),
      providerRef: String(e.providerRef),
      valorPagoCentavos: Number(e.valorPagoCentavos),
      pagoEm: new Date(e.pagoEm),
    };
  },
};
