import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL as string;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

async function main() {
  const sql = postgres(DATABASE_URL, {
    ssl: "require",
    max: 1,
    connect_timeout: 10,
  });

  try {
    const result = await sql`
      ALTER TABLE scenario_steps ADD COLUMN IF NOT EXISTS messages jsonb
    `;
    console.log("Migration applied successfully");
  } catch (e: unknown) {
    console.log("Error:", e instanceof Error ? e.message : String(e));
  } finally {
    await sql.end();
  }
}

main();
