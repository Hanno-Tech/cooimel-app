// Contrato que cada banco/provedor implementa. Hoje: mock. Depois: Cresol.

export type CobrancaInput = {
  cobrancaId: string;
  valorCentavos: number;
  vencimento: string; // YYYY-MM-DD
  pagador: { nome: string; cpf: string };
  descricao: string;
};

export type BoletoResult = {
  providerRef: string;
  linhaDigitavel: string;
  codigoBarras: string;
  expiraEm: Date | null;
};

export type PixResult = {
  providerRef: string;
  copiaCola: string;
  expiraEm: Date | null;
};

export type PagamentoEvento = {
  eventId: string;
  providerRef: string;
  valorPagoCentavos: number;
  pagoEm: Date;
};

export interface PaymentGateway {
  readonly nome: string;
  criarBoleto(c: CobrancaInput): Promise<BoletoResult>;
  criarPix(c: CobrancaInput): Promise<PixResult>;
  cancelar(providerRef: string): Promise<void>;
  /** Valida autenticidade (assinatura/mTLS) e normaliza o evento. */
  parseWebhook(body: string, headers: Headers): Promise<PagamentoEvento>;
}
