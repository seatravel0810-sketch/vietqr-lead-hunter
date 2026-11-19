import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/vietqr_lead_hunter";

const globalForPg = globalThis as unknown as {
  __vietqrHunterPgClient?: ReturnType<typeof postgres>;
};

// Client kết nối Supabase Transaction Pooler (port 6543) tối ưu cho Serverless
export const pgClient =
  globalForPg.__vietqrHunterPgClient ||
  postgres(connectionString, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.__vietqrHunterPgClient = pgClient;
}

export const db = drizzle(pgClient, { schema });
