import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

// Reaproveita a conexão entre hot reloads (dev) e invocações (Fluid Compute).
const client =
  globalForDb.pg ?? postgres(process.env.DATABASE_URL!, { max: 5, prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema, casing: "snake_case" });
export { schema };
