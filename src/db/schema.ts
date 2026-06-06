import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import type { ScenarioOption, ThreatCategory } from "../lib/demo-types";

export const schools = pgTable(
  "schools",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    region: varchar("region", { length: 80 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("schools_name_idx").on(table.name)]
);

export const classes = pgTable(
  "classes",
  {
    id: serial("id").primaryKey(),
    schoolId: integer("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    cohort: varchar("cohort", { length: 40 }).notNull(),
    pilotWeek: integer("pilot_week").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("classes_school_name_idx").on(table.schoolId, table.name)]
);

export const anonSessions = pgTable("anon_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  classId: integer("class_id").references(() => classes.id, { onDelete: "set null" }),
  sessionToken: varchar("session_token", { length: 96 }).notNull().unique(),
  presentationMode: boolean("presentation_mode").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
});

export const scenarioTemplates = pgTable("scenario_templates", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 96 }).notNull().unique(),
  title: varchar("title", { length: 160 }).notNull(),
  threatCategory: varchar("threat_category", { length: 40 })
    .$type<ThreatCategory>()
    .notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const scenarioSteps = pgTable(
  "scenario_steps",
  {
    id: serial("id").primaryKey(),
    scenarioId: integer("scenario_id")
      .notNull()
      .references(() => scenarioTemplates.id, { onDelete: "cascade" }),
    stepKey: varchar("step_key", { length: 96 }).notNull(),
    order: integer("order").notNull(),
    situation: text("situation").notNull(),
    question: text("question").notNull(),
    options: jsonb("options").$type<ScenarioOption[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("scenario_steps_scenario_step_idx").on(
      table.scenarioId,
      table.stepKey
    ),
  ]
);

export const scenarioAttempts = pgTable("scenario_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => anonSessions.id, { onDelete: "cascade" }),
  scenarioId: integer("scenario_id")
    .notNull()
    .references(() => scenarioTemplates.id, { onDelete: "cascade" }),
  mode: varchar("mode", { length: 24 }).default("demo").notNull(),
  score: integer("score").default(0).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const scenarioResponses = pgTable("scenario_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  attemptId: uuid("attempt_id")
    .notNull()
    .references(() => scenarioAttempts.id, { onDelete: "cascade" }),
  stepId: integer("step_id")
    .notNull()
    .references(() => scenarioSteps.id, { onDelete: "cascade" }),
  selectedOptionId: varchar("selected_option_id", { length: 96 }).notNull(),
  isSafe: boolean("is_safe").notNull(),
  riskDelta: integer("risk_delta").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const footprintProfiles = pgTable("footprint_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => anonSessions.id, { onDelete: "cascade" }),
  publicName: varchar("public_name", { length: 120 }).notNull(),
  selectedSignals: jsonb("selected_signals").$type<string[]>().notNull(),
  riskScore: integer("risk_score").notNull(),
  derivedRisks: jsonb("derived_risks").$type<string[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
