import { randomUUID } from "node:crypto";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import {
  anonSessions,
  classes,
  footprintProfiles,
  scenarioAttempts,
  scenarioResponses,
  scenarioSteps,
  scenarioTemplates as scenarioTemplatesTable,
} from "@/db/schema";
import { calculateFootprintRisk, getScenarioFeedback, summarizeDashboardFromResponses } from "@/lib/scoring";
import type { DashboardOverview, FootprintInput, FootprintRiskSummary, ScenarioFeedback } from "@/lib/demo-types";

export async function createAnonSession(presentationMode = false) {
  const sessionToken = randomUUID();

  if (!db) {
    return { sessionToken, stored: false };
  }

  const [classRow] = await db.select({ id: classes.id }).from(classes).limit(1);

  await db.insert(anonSessions).values({
    classId: classRow?.id,
    sessionToken,
    presentationMode,
  });

  return { sessionToken, stored: true };
}

async function getOrCreateSession(sessionToken: string) {
  if (!db) {
    return null;
  }

  const [session] = await db
    .select()
    .from(anonSessions)
    .where(eq(anonSessions.sessionToken, sessionToken))
    .limit(1);

  if (session) {
    return session;
  }

  const [created] = await db
    .insert(anonSessions)
    .values({ sessionToken })
    .returning();

  return created;
}

export async function recordScenarioAnswer(input: {
  sessionToken: string;
  scenarioSlug: string;
  stepKey: string;
  selectedOptionId: string;
  attemptId?: string;
}): Promise<ScenarioFeedback> {
  const fallbackFeedback = getScenarioFeedback(
    input.scenarioSlug,
    input.stepKey,
    input.selectedOptionId,
    input.attemptId ?? randomUUID()
  );

  if (!db) {
    return fallbackFeedback;
  }

  const session = await getOrCreateSession(input.sessionToken);

  const [scenario] = await db
    .select()
    .from(scenarioTemplatesTable)
    .where(eq(scenarioTemplatesTable.slug, input.scenarioSlug))
    .limit(1);

  if (!session || !scenario) {
    return fallbackFeedback;
  }

  const [step] = await db
    .select()
    .from(scenarioSteps)
    .where(
      and(
        eq(scenarioSteps.scenarioId, scenario.id),
        eq(scenarioSteps.stepKey, input.stepKey)
      )
    )
    .limit(1);

  if (!step) {
    return fallbackFeedback;
  }

  const [attempt] = input.attemptId
    ? await db
        .select()
        .from(scenarioAttempts)
        .where(eq(scenarioAttempts.id, input.attemptId))
        .limit(1)
    : await db
        .insert(scenarioAttempts)
        .values({
          sessionId: session.id,
          scenarioId: scenario.id,
          mode: "demo",
          score: 0,
        })
        .returning();

  if (!attempt) {
    return fallbackFeedback;
  }

  const option = step.options.find((item) => item.id === input.selectedOptionId);

  if (!option) {
    return fallbackFeedback;
  }

  await db.insert(scenarioResponses).values({
    attemptId: attempt.id,
    stepId: step.id,
    selectedOptionId: input.selectedOptionId,
    isSafe: option.isSafe,
    riskDelta: option.riskDelta,
  });

  await db
    .update(scenarioAttempts)
    .set({
      score: option.isSafe ? 100 : 45,
      completedAt: new Date(),
    })
    .where(eq(scenarioAttempts.id, attempt.id));

  return {
    ...fallbackFeedback,
    attemptId: attempt.id,
  };
}

export async function saveFootprintProfile(
  sessionToken: string,
  input: FootprintInput
): Promise<FootprintRiskSummary> {
  const summary = calculateFootprintRisk(input);

  if (!db) {
    return summary;
  }

  const session = await getOrCreateSession(sessionToken);

  if (!session) {
    return summary;
  }

  await db.insert(footprintProfiles).values({
    sessionId: session.id,
    publicName: input.publicName,
    selectedSignals: input.selectedSignals,
    riskScore: summary.riskScore,
    derivedRisks: summary.derivedRisks,
  });

  return summary;
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  if (!db) {
    const { presentationDashboard } = await import("@/lib/demo-data");
    return presentationDashboard;
  }

  const rows = await db
    .select({
      category: scenarioTemplatesTable.threatCategory,
      isSafe: scenarioResponses.isSafe,
    })
    .from(scenarioResponses)
    .innerJoin(
      scenarioAttempts,
      eq(scenarioResponses.attemptId, scenarioAttempts.id)
    )
    .innerJoin(
      scenarioTemplatesTable,
      eq(scenarioAttempts.scenarioId, scenarioTemplatesTable.id)
    );

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(anonSessions);

  return summarizeDashboardFromResponses(rows, count);
}
