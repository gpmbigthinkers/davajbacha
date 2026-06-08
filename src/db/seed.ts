import { eq } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import {
  classes,
  scenarioSteps,
  scenarioTemplates as scenarioTemplatesTable,
  schools,
  users,
} from "./schema";
import { scenarioTemplates } from "../lib/platform-data";
import { hashPassword } from "../lib/auth";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for pnpm db:seed");
}

const client = postgres(connectionString, {
  ssl: process.env.DATABASE_SSL === "false" ? false : "require",
});
const db = drizzle(client);

async function main() {
  const [school] = await db
    .insert(schools)
    .values({
      name: "GPM Park mladeze Kosice",
      region: "Kosicky kraj",
    })
    .onConflictDoNothing()
    .returning();

  const existingSchool =
    school ??
    (
      await db
        .select()
        .from(schools)
        .where(eq(schools.name, "GPM Park mladeze Kosice"))
        .limit(1)
    )[0];

  if (existingSchool) {
    await db
      .insert(classes)
      .values({
        schoolId: existingSchool.id,
        name: "II.AA",
        cohort: "Ideathon 2026",
        pilotWeek: 1,
      })
      .onConflictDoNothing();
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error("ADMIN_PASSWORD environment variable must be set and at least 12 characters for seed.");
  }

  await db
    .insert(users)
    .values({
      email: "admin@davajbacha.sk",
      name: "Admin",
      passwordHash: hashPassword(adminPassword),
      role: "admin",
    })
    .onConflictDoNothing();

  for (const scenario of scenarioTemplates) {
    const [insertedScenario] = await db
      .insert(scenarioTemplatesTable)
      .values({
        slug: scenario.slug,
        title: scenario.title,
        threatCategory: scenario.category,
        summary: scenario.summary,
        accent: scenario.accent,
      })
      .onConflictDoNothing()
      .returning();

    const row =
      insertedScenario ??
      (
        await db
          .select()
          .from(scenarioTemplatesTable)
          .where(eq(scenarioTemplatesTable.slug, scenario.slug))
          .limit(1)
      )[0];

    if (!row) {
      continue;
    }

    for (const [index, step] of scenario.steps.entries()) {
      await db
        .insert(scenarioSteps)
        .values({
          scenarioId: row.id,
          stepKey: step.key,
          title: step.title,
          order: index + 1,
          situation: step.situation,
          question: step.question,
          options: step.options,
        })
        .onConflictDoNothing();
    }
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
