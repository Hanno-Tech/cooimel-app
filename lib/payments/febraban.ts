// Geração de código de barras / linha digitável no padrão FEBRABAN e BR Code Pix.
// Usado pelo gateway mock para produzir dados com formato e dígitos válidos.

export function mod10(num: string): number {
  let soma = 0;
  let peso = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    let p = Number(num[i]) * peso;
    if (p > 9) p = Math.floor(p / 10) + (p % 10);
    soma += p;
    peso = peso === 2 ? 1 : 2;
  }
  const r = soma % 10;
  return r === 0 ? 0 : 10 - r;
}

export function mod11Barras(num: string): number {
  let soma = 0;
  let peso = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    soma += Number(num[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const r = 11 - (soma % 11);
  return r === 0 || r === 10 || r === 11 ? 1 : r;
}

/** Fator de vencimento, com o reinício em 22/02/2025 (fator volta a 1000). */
export function fatorVencimento(vencISO: string): string {
  const base = Date.UTC(1997, 9, 7);
  const v = Date.UTC(+vencISO.slice(0, 4), +vencISO.slice(5, 7) - 1, +vencISO.slice(8, 10));
  let dias = Math.round((v - base) / 86_400_000);
  if (dias > 9999) dias = ((dias - 10000) % 9000) + 1000;
  return String(dias).padStart(4, "0");
}

/** banco(3) + moeda(1) + DV + fator(4) + valor(10) + campo livre(25) = 44 dígitos */
export function codigoBarras(banco: string, vencISO: string, valorCentavos: number, campoLivre: string) {
  const semDv =
    banco + "9" + fatorVencimento(vencISO) + String(valorCentavos).padStart(10, "0") + campoLivre;
  const dv = mod11Barras(semDv);
  return semDv.slice(0, 4) + dv + semDv.slice(4);
}

export function linhaDigitavel(barras: string) {
  const c1 = barras.slice(0, 4) + barras.slice(19, 24);
  const c2 = barras.slice(24, 34);
  const c3 = barras.slice(34, 44);
  const l = c1 + mod10(c1) + c2 + mod10(c2) + c3 + mod10(c3) + barras[4] + barras.slice(5, 19);
  return `${l.slice(0, 5)}.${l.slice(5, 10)} ${l.slice(10, 15)}.${l.slice(15, 21)} ${l.slice(21, 26)}.${l.slice(26, 32)} ${l[32]} ${l.slice(33)}`;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const tlv = (id: string, v: string) => id + String(v.length).padStart(2, "0") + v;

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** BR Code (Pix copia e cola) estático com valor e txid. */
export function brCodePix(opts: {
  chave: string;
  valorCentavos: number;
  nome: string;
  cidade: string;
  txid: string;
}) {
  const conta = tlv("00", "br.gov.bcb.pix") + tlv("01", opts.chave);
  const p =
    tlv("00", "01") +
    tlv("26", conta) +
    tlv("52", "0000") +
    tlv("53", "986") +
    tlv("54", (opts.valorCentavos / 100).toFixed(2)) +
    tlv("58", "BR") +
    tlv("59", semAcento(opts.nome).slice(0, 25)) +
    tlv("60", semAcento(opts.cidade).slice(0, 15)) +
    tlv("62", tlv("05", opts.txid.slice(0, 25))) +
    "6304";
  return p + crc16(p);
}
