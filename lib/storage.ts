import "server-only";
import { del, get, put } from "@vercel/blob";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

// Arquivos privados (fotos de associados). Em produção: Vercel Blob privado.
// Em dev sem Blob configurado: pasta ./.uploads.

const usaBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const LOCAL_DIR = path.join(process.cwd(), ".uploads");

function caminhoLocal(key: string) {
  const p = path.join(LOCAL_DIR, key);
  if (!p.startsWith(LOCAL_DIR + path.sep)) throw new Error("chave inválida");
  return p;
}

export async function salvarArquivo(key: string, data: Buffer, contentType: string) {
  if (usaBlob) {
    await put(key, data, { access: "private", contentType, allowOverwrite: true });
    return;
  }
  const p = caminhoLocal(key);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, data);
}

export async function lerArquivo(
  key: string,
): Promise<{ body: ReadableStream<Uint8Array> | Buffer; contentType: string } | null> {
  if (usaBlob) {
    const r = await get(key, { access: "private" });
    if (!r || r.statusCode !== 200) return null;
    return { body: r.stream, contentType: r.blob.contentType };
  }
  try {
    const body = await readFile(caminhoLocal(key));
    return { body, contentType: key.endsWith(".webp") ? "image/webp" : "application/octet-stream" };
  } catch {
    return null;
  }
}

export async function removerArquivo(key: string) {
  if (usaBlob) {
    await del(key);
    return;
  }
  await rm(caminhoLocal(key), { force: true });
}
