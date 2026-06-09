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

// Strip unsupported params and normalize the connection string
const connectionString = raw
  .replace(/([&?])channel_binding=[^&]*/g, "$1")
  .replace(/[?&]$/, "");

// Neon requires explicit SSL config — sslmode in the URL alone is not enough
// for all pg versions running on external hosts like Render
const isNeon = connectionString.includes("neon.tech");

export const pool = new Pool({
  connectionString,
  ...(isNeon ? { ssl: { rejectUnauthorized: false } } : {}),
});
export const db = drizzle(pool, { schema });

export * from "./schema";
