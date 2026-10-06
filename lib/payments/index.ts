import "server-only";
import type { PaymentGateway } from "./gateway";
import { mockGateway } from "./mock";

const gateways: Record<string, PaymentGateway> = {
  mock: mockGateway,
  // cresol: cresolGateway,  ← implementar quando houver acesso à API de cobrança
};

export function provedorAtual() {
  return process.env.PAYMENT_PROVIDER ?? "mock";
}

export function getGateway(nome = provedorAtual()): PaymentGateway {
  const g = gateways[nome];
  if (!g) throw new Error(`Gateway de pagamento desconhecido: ${nome}`);
  return g;
}

export const ehMock = () => provedorAtual() === "mock";
