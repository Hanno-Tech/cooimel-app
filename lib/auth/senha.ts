import "server-only";
import { hash, verify } from "@node-rs/argon2";
import { randomInt } from "node:crypto";

const OPCOES = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export function hashSenha(senha: string) {
  return hash(senha, OPCOES);
}

export function verificarSenha(senhaHash: string, senha: string) {
  return verify(senhaHash, senha);
}

// Hash fixo usado quando o CPF não existe, para o tempo de resposta não revelar isso.
let hashFalso: Promise<string> | undefined;
export function hashParaComparacaoFalsa() {
  hashFalso ??= hashSenha("senha-inexistente-para-tempo-constante");
  return hashFalso;
}

/** Senha temporária legível (sem caracteres ambíguos), para o admin entregar ao associado. */
export function gerarSenhaTemporaria(tamanho = 8) {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: tamanho }, () => chars[randomInt(chars.length)]).join("");
}

export const REGRA_SENHA = "A senha deve ter ao menos 8 caracteres, com letras e números.";
export function senhaForte(s: string) {
  return s.length >= 8 && /[a-zA-Z]/.test(s) && /\d/.test(s);
}
