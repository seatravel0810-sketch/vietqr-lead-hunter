import postgres from "postgres";
import fs from "fs";
import path from "path";

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  }
}

const connectionString =
  process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing DATABASE_URL in .env.local");
  process.exit(1);
}

console.log("Connecting to Supabase PostgreSQL at:", connectionString.split("@")[1]);
const sql = postgres(connectionString, {
  prepare: false,
  connect_timeout: 15,
});

async function run() {
  try {
    const sqlPath = path.resolve(process.cwd(), "replica/schema.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");
    console.log("Executing schema.sql on Supabase...");
    await sql.unsafe(sqlContent);
    console.log("✅ All 6 tables, indexes, and constraints successfully created in Supabase!");
    await sql.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error:", err);
    await sql.end();
    process.exit(1);
  }
}

run();
