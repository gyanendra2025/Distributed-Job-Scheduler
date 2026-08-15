import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://djp:djp@localhost:5432/djp";

export const pool = new Pool({ connectionString });

export async function closeDb(): Promise<void> {
  await pool.end();
}
