// Cria a configuração inicial e o primeiro administrador.
// Uso: SEED_ADMIN_CPF=... SEED_ADMIN_SENHA=... npm run db:seed
import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../lib/db/schema";

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema, casing: "snake_case" });

async function main() {
  await db.insert(schema.configuracao).values({ id: 1 }).onConflictDoNothing();

  const cpf = (process.env.SEED_ADMIN_CPF ?? "").replace(/\D/g, "");
  const senha = process.env.SEED_ADMIN_SENHA ?? "";
  if (cpf.length !== 11 || senha.length < 8) {
    console.log("Configuração criada. Defina SEED_ADMIN_CPF e SEED_ADMIN_SENHA para criar o admin.");
    return;
  }
  await db
    .insert(schema.usuario)
    .values({
      cpf,
      nome: process.env.SEED_ADMIN_NOME ?? "Administrador",
      senhaHash: await hash(senha, { memoryCost: 19456, timeCost: 2, parallelism: 1 }),
      papel: "admin",
      deveTrocarSenha: false,
    })
    .onConflictDoNothing();
  console.log(`Admin ${cpf} pronto.`);
}

main().finally(() => client.end());
