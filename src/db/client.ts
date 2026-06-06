import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

const connectionString = process.env.DATABASE_URL;

const globalForDb = globalThis as unknown as {
  postgresClient?: ReturnType<typeof postgres>;
};

export const isDatabaseConfigured = Boolean(connectionString);

const client =
  connectionString == null
    ? null
    : (globalForDb.postgresClient ??= postgres(connectionString, {
        max: 5,
        ssl: process.env.DATABASE_SSL === "false" ? false : "require",
      }));

export const db = client ? drizzle(client, { schema }) : null;

export async function closeDatabaseConnection() {
  if (client) {
    await client.end();
  }
}
