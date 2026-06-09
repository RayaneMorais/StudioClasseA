import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const raw = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!raw) {
  throw new Error(
    "NEON_DATABASE_URL ou DATABASE_URL deve estar definido.",
  );
}

// Remove channel_binding=require — not supported by the pg library version used
const connectionString = raw.replace(/([&?])channel_binding=[^&]*/g, "$1").replace(/[?&]$/, "");

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

export * from "./schema";
