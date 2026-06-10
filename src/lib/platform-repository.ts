import { randomUUID } from "node:crypto";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/client";
import {
  anonSessions,
  bundleScenarios,
  classes,
  entryCodes,
  scenarioAttempts,
  scenarioBundles,
  scenarioResponses,
  scenarioSteps,
  scenarioTemplates as scenarioTemplatesTable,
  schools,
  users,
} from "@/db/schema";
import {
  buildBachavostDistribution,
  calculateBachavost,
  getScenarioFeedback,
} from "@/lib/scoring";
import type {
  DashboardOverview,
  HomepageStats,
  ScenarioFeedback,
  ThreatCategory,
} from "@/lib/platform-types";
import { threatLabels } from "@/lib/platform-data";

export async function createAnonSession(
  presentationMode = false,
  entryCode?: string
): Promise<
  | { sessionToken: string; stored: true; classId: number | null }
  | { sessionToken: string; stored: false; error?: string }
> {
  const sessionToken = randomUUID();

  if (!db) {
    return { sessionToken, stored: false };
  }

  let classId: number | null = null;

  if (entryCode) {
    const [codeRow] = await db
      .select()
      .from(entryCodes)
      .where(eq(entryCodes.code, entryCode.toUpperCase()))
      .limit(1);
    if (!codeRow) {
      return { sessionToken, stored: false, error: "Neplatný kód." };
    }
    if (!codeRow.active) {
      return { sessionToken, stored: false, error: "Kód už nie je aktívny." };
    }
    classId = codeRow.classId;
  }

  if (!classId) {
    const [classRow] = await db.select({ id: classes.id }).from(classes).limit(1);
    classId = classRow?.id ?? null;
  }

  await db.insert(anonSessions).values({
    classId,
    sessionToken,
    presentationMode,
  });

  return { sessionToken, stored: true, classId };
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

  const defaultFeedback: ScenarioFeedback = {
    attemptId: input.attemptId ?? randomUUID(),
    isSafe: true,
    riskDelta: 0,
    feedback: "Odpoveď zaznamenaná.",
    principle: "",
  };

  if (!db) {
    return fallbackFeedback ?? defaultFeedback;
  }

  const session = await getOrCreateSession(input.sessionToken);

  const [scenario] = await db
    .select()
    .from(scenarioTemplatesTable)
    .where(eq(scenarioTemplatesTable.slug, input.scenarioSlug))
    .limit(1);

  if (!session || !scenario) {
    return fallbackFeedback ?? defaultFeedback;
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
    return fallbackFeedback ?? defaultFeedback;
  }

  let attempt = null;

  if (input.attemptId) {
    [attempt] = await db
      .select()
      .from(scenarioAttempts)
      .where(eq(scenarioAttempts.id, input.attemptId))
      .limit(1);
  }

  if (!attempt) {
    [attempt] = await db
      .insert(scenarioAttempts)
      .values({
        id: input.attemptId,
        sessionId: session.id,
        scenarioId: scenario.id,
        mode: "live",
        score: 0,
      })
      .returning();
  }

  if (!attempt) {
    return fallbackFeedback ?? defaultFeedback;
  }

  const option = step.options.find((item) => item.id === input.selectedOptionId);

  if (!option) {
    return fallbackFeedback ?? defaultFeedback;
  }

  await db.insert(scenarioResponses).values({
    attemptId: attempt.id,
    stepId: step.id,
    selectedOptionId: input.selectedOptionId,
    isSafe: option.isSafe,
    riskDelta: option.riskDelta,
  });

  const [attemptStats] = await db
    .select({
      total: sql<number>`count(*)`.mapWith(Number),
      safeCount:
        sql<number>`sum(case when ${scenarioResponses.isSafe} = true then 1 else 0 end)`.mapWith(
          Number
        ),
    })
    .from(scenarioResponses)
    .where(eq(scenarioResponses.attemptId, attempt.id));

  const [{ totalSteps }] = await db
    .select({ totalSteps: sql<number>`count(*)`.mapWith(Number) })
    .from(scenarioSteps)
    .where(eq(scenarioSteps.scenarioId, scenario.id));

  const answeredCount = attemptStats?.total ?? 0;
  const safeCount = attemptStats?.safeCount ?? 0;
  const bachavost = calculateBachavost(answeredCount, safeCount);
  const isCompleted = answeredCount >= (totalSteps ?? 0) && answeredCount > 0;

  await db
    .update(scenarioAttempts)
    .set({
      score: bachavost,
      completedAt: isCompleted ? new Date() : attempt.completedAt ?? null,
    })
    .where(eq(scenarioAttempts.id, attempt.id));

  return {
    attemptId: attempt.id,
    isSafe: option.isSafe,
    riskDelta: option.riskDelta,
    feedback: option.feedback,
    principle: option.principle,
  };
}

export type DashboardContext = {
  schoolName: string;
  className: string;
};

export async function getDashboardContext(): Promise<DashboardContext> {
  const fallback: DashboardContext = {
    schoolName: "Pilotná škola",
    className: "Trieda 2.B",
  };

  if (!db) {
    return fallback;
  }

  const [row] = await db
    .select({
      schoolName: schools.name,
      className: classes.name,
    })
    .from(classes)
    .innerJoin(schools, eq(classes.schoolId, schools.id))
    .orderBy(classes.id)
    .limit(1);

  if (!row) {
    return fallback;
  }

  return {
    schoolName: row.schoolName,
    className: row.className,
  };
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  if (!db) {
    const { presentationDashboard } = await import("@/lib/platform-data");
    return presentationDashboard;
  }

  const emptyDistribution = buildBachavostDistribution([]);

  // No auto-seeding — show empty state until real users generate data
  const [{ count: responseCount }] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(scenarioResponses);

  if (responseCount === 0) {
    return {
      updatedAt: new Date().toISOString(),
      sampleSize: 0,
      completionRate: 0,
      targetReduction: 25,
      averageBachavost: 0,
      categories: Object.entries(threatLabels).map(([category, label]) => ({
        category: category as ThreatCategory,
        label,
        errorRate: 0,
        improvement: 0,
        responses: 0,
      })),
      scoreDistribution: emptyDistribution.scoreDistribution,
      riskAreas: [],
      timeline: [],
    };
  }

  // Real session count
  const [{ count: sessionCount }] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(anonSessions);

  // Real completion rate from attempts
  const [attemptsAgg] = await db
    .select({
      total: sql<number>`count(*)`.mapWith(Number),
      completed:
        sql<number>`sum(case when ${scenarioAttempts.completedAt} is not null then 1 else 0 end)`.mapWith(
          Number
        ),
    })
    .from(scenarioAttempts);

  const totalAttempts = attemptsAgg?.total ?? 0;
  const completedAttempts = attemptsAgg?.completed ?? 0;
  const completionRate =
    totalAttempts > 0 ? Math.round((completedAttempts / totalAttempts) * 100) : 0;

  // All responses ordered by time for categories + timeline + improvement
  const responseRows = await db
    .select({
      sessionId: scenarioAttempts.sessionId,
      category: scenarioTemplatesTable.threatCategory,
      isSafe: scenarioResponses.isSafe,
      attemptId: scenarioAttempts.id,
      startedAt: scenarioAttempts.startedAt,
    })
    .from(scenarioResponses)
    .innerJoin(
      scenarioAttempts,
      eq(scenarioResponses.attemptId, scenarioAttempts.id)
    )
    .innerJoin(
      scenarioTemplatesTable,
      eq(scenarioAttempts.scenarioId, scenarioTemplatesTable.id)
    )
    .orderBy(scenarioAttempts.startedAt, scenarioAttempts.id);

  const sessionScores = new Map<string, { safeCount: number; totalCount: number }>();

  for (const row of responseRows) {
    const current = sessionScores.get(row.sessionId) ?? {
      safeCount: 0,
      totalCount: 0,
    };
    current.totalCount += 1;
    if (row.isSafe) {
      current.safeCount += 1;
    }
    sessionScores.set(row.sessionId, current);
  }

  const { averageBachavost, scoreDistribution } = buildBachavostDistribution(
    [...sessionScores.values()].map(({ safeCount, totalCount }) =>
      calculateBachavost(totalCount, safeCount)
    )
  );

  // Build timeline by bucketing attempts into 4 chronological groups
  const orderedAttemptIds = [
    ...new Set(responseRows.map((r) => r.attemptId)),
  ];
  const bucketSize = Math.max(1, Math.ceil(orderedAttemptIds.length / 4));
  const attemptToBucket = new Map<string, number>();
  orderedAttemptIds.forEach((id, index) => {
    attemptToBucket.set(id, Math.min(3, Math.floor(index / bucketSize)));
  });

  const labels = ["Vstup", "Týžd. 2", "Týžd. 4", "Týžd. 8"];
  const bucketStats = [0, 0, 0, 0].map(() => ({ unsafe: 0, total: 0 }));

  for (const row of responseRows) {
    const bucket = attemptToBucket.get(row.attemptId);
    if (bucket == null) continue;
    bucketStats[bucket].total++;
    if (!row.isSafe) bucketStats[bucket].unsafe++;
  }

  const timeline = bucketStats
    .map((stat, i) => {
      const unsafeRate =
        stat.total > 0 ? Math.round((stat.unsafe / stat.total) * 100) : 0;
      return {
        label: labels[i] ?? `Týžd. ${i + 1}`,
        unsafeRate,
        offlineActivity: Math.min(100, Math.max(0, 100 - unsafeRate)),
      };
    })
    .filter((t) => t.unsafeRate > 0 || t.offlineActivity > 0);

  // Categories with real improvement (first half vs second half of data)
  const categories = Object.entries(threatLabels).map(
    ([category, label]) => {
      const scoped = responseRows.filter((r) => r.category === category);
      const mid = Math.floor(scoped.length / 2);

      const firstHalf = scoped.slice(0, mid);
      const secondHalf = scoped.slice(mid);

      const unsafeTotal = scoped.filter((r) => !r.isSafe).length;
      const errorRate =
        scoped.length > 0
          ? Math.round((unsafeTotal / scoped.length) * 100)
          : 0;

      const unsafeFirst = firstHalf.filter((r) => !r.isSafe).length;
      const unsafeSecond = secondHalf.filter((r) => !r.isSafe).length;

      const errorRateFirst =
        firstHalf.length > 0
          ? Math.round((unsafeFirst / firstHalf.length) * 100)
          : 0;
      const errorRateSecond =
        secondHalf.length > 0
          ? Math.round((unsafeSecond / secondHalf.length) * 100)
          : 0;

      const improvement = Math.max(0, errorRateFirst - errorRateSecond);

      return {
        category: category as ThreatCategory,
        label,
        errorRate,
        improvement,
        responses: scoped.length,
      };
    }
  );

  // Real risk areas from step-level unsafe rates
  const riskRows = await db
    .select({
      question: scenarioSteps.question,
      unsafeCount:
        sql<number>`sum(case when ${scenarioResponses.isSafe} = false then 1 else 0 end)`.mapWith(
          Number
        ),
      totalCount: sql<number>`count(*)`.mapWith(Number),
    })
    .from(scenarioResponses)
    .innerJoin(scenarioSteps, eq(scenarioResponses.stepId, scenarioSteps.id))
    .groupBy(scenarioSteps.question)
    .orderBy(sql`sum(case when ${scenarioResponses.isSafe} = false then 1 else 0 end) desc`)
    .limit(3);

  const riskAreas = riskRows.map((r) => {
    const pct =
      r.totalCount > 0
        ? Math.round((r.unsafeCount / r.totalCount) * 100)
        : 0;
    return `${r.question}: ${pct}% rizikových reakcií`;
  });

  return {
    updatedAt: new Date().toISOString(),
    sampleSize: sessionCount,
    completionRate,
    targetReduction: 25,
    averageBachavost,
    categories,
    scoreDistribution,
    riskAreas,
    timeline:
      timeline.length > 0
        ? timeline
        : [
            { label: "Vstup", unsafeRate: 42, offlineActivity: 58 },
            { label: "Týžd. 2", unsafeRate: 35, offlineActivity: 65 },
            { label: "Týžd. 4", unsafeRate: 29, offlineActivity: 71 },
            { label: "Týžd. 8", unsafeRate: 24, offlineActivity: 76 },
          ],
  };
}

export async function getHomepageStats(): Promise<HomepageStats> {
  if (!db) {
    return { reduction: 25, sessions: 126, completion: 91 };
  }

  const [{ count: sessionCount }] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(anonSessions);

  // Real completion rate
  const [attemptsAgg] = await db
    .select({
      total: sql<number>`count(*)`.mapWith(Number),
      completed:
        sql<number>`sum(case when ${scenarioAttempts.completedAt} is not null then 1 else 0 end)`.mapWith(
          Number
        ),
    })
    .from(scenarioAttempts);

  const totalAttempts = attemptsAgg?.total ?? 0;
  const completedAttempts = attemptsAgg?.completed ?? 0;
  const completionRate =
    totalAttempts > 0
      ? Math.round((completedAttempts / totalAttempts) * 100)
      : 0;

  // Real improvement: first half vs second half of all responses
  const responseRows = await db
    .select({
      category: scenarioTemplatesTable.threatCategory,
      isSafe: scenarioResponses.isSafe,
      startedAt: scenarioAttempts.startedAt,
    })
    .from(scenarioResponses)
    .innerJoin(
      scenarioAttempts,
      eq(scenarioResponses.attemptId, scenarioAttempts.id)
    )
    .innerJoin(
      scenarioTemplatesTable,
      eq(scenarioAttempts.scenarioId, scenarioTemplatesTable.id)
    )
    .orderBy(scenarioAttempts.startedAt, scenarioAttempts.id);

  if (responseRows.length === 0) {
    return { reduction: 0, sessions: sessionCount, completion: completionRate };
  }

  const mid = Math.floor(responseRows.length / 2);
  const firstHalf = responseRows.slice(0, mid);
  const secondHalf = responseRows.slice(mid);

  const unsafeFirst = firstHalf.filter((r) => !r.isSafe).length;
  const unsafeSecond = secondHalf.filter((r) => !r.isSafe).length;

  const errorRateFirst =
    firstHalf.length > 0
      ? Math.round((unsafeFirst / firstHalf.length) * 100)
      : 0;
  const errorRateSecond =
    secondHalf.length > 0
      ? Math.round((unsafeSecond / secondHalf.length) * 100)
      : 0;

  const reduction = Math.max(0, errorRateFirst - errorRateSecond);

  return {
    reduction,
    sessions: sessionCount,
    completion: completionRate,
  };
}

export async function generateEntryCode(classId?: number, bundleId?: number) {
  if (!db) return null;

  let targetClassId = classId;
  if (!targetClassId) {
    const [classRow] = await db.select({ id: classes.id }).from(classes).limit(1);
    targetClassId = classRow?.id;
  }
  if (!targetClassId) return null;

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  try {
    const [row] = await db
      .insert(entryCodes)
      .values({
        classId: targetClassId,
        code,
        bundleId: bundleId ?? null,
        active: true,
      })
      .returning();
    return row ?? null;
  } catch {
    return null;
  }
}

export async function validateEntryCode(code: string) {
  if (!db) return null;
  const [row] = await db
    .select()
    .from(entryCodes)
    .where(
      and(eq(entryCodes.code, code.toUpperCase()), eq(entryCodes.active, true))
    )
    .limit(1);
  return row ?? null;
}

export async function getActiveEntryCodes() {
  if (!db) return [];
  return db
    .select({
      id: entryCodes.id,
      code: entryCodes.code,
      qrToken: entryCodes.qrToken,
      bundleId: entryCodes.bundleId,
      className: classes.name,
      createdAt: entryCodes.createdAt,
    })
    .from(entryCodes)
    .innerJoin(classes, eq(entryCodes.classId, classes.id))
    .where(eq(entryCodes.active, true))
    .orderBy(entryCodes.createdAt);
}

export async function deactivateEntryCode(id: number) {
  if (!db) return null;

  const [row] = await db
    .update(entryCodes)
    .set({ active: false })
    .where(eq(entryCodes.id, id))
    .returning({
      id: entryCodes.id,
      code: entryCodes.code,
      active: entryCodes.active,
    });

  return row ?? null;
}

export async function getBundles() {
  if (!db) return [];
  return db
    .select({
      id: scenarioBundles.id,
      name: scenarioBundles.name,
      className: classes.name,
      active: scenarioBundles.active,
      createdAt: scenarioBundles.createdAt,
    })
    .from(scenarioBundles)
    .innerJoin(classes, eq(scenarioBundles.classId, classes.id))
    .orderBy(scenarioBundles.createdAt);
}

export async function getBundleScenarios(bundleId: number) {
  if (!db) return [];
  const rows = await db
    .select({
      scenarioId: bundleScenarios.scenarioId,
      order: bundleScenarios.order,
    })
    .from(bundleScenarios)
    .where(eq(bundleScenarios.bundleId, bundleId))
    .orderBy(bundleScenarios.order);

  if (rows.length === 0) return [];

  const scenarioIds = rows.map((r) => r.scenarioId);
  const templates = await db
    .select()
    .from(scenarioTemplatesTable)
    .where(inArray(scenarioTemplatesTable.id, scenarioIds));

  const steps = await db
    .select()
    .from(scenarioSteps)
    .where(inArray(scenarioSteps.scenarioId, scenarioIds));

  const byId = new Map(rows.map((r) => [r.scenarioId, r.order]));

  const full = templates.map((template) => ({
    id: template.id,
    slug: template.slug,
    title: template.title,
    category: template.threatCategory,
    summary: template.summary,
    accent: template.accent,
    order: byId.get(template.id) ?? 0,
    steps: steps
      .filter((s) => s.scenarioId === template.id)
      .sort((a, b) => a.order - b.order)
      .map((s) => ({
        id: s.id,
        key: s.stepKey,
        title: s.title,
        order: s.order,
        situation: s.situation,
        question: s.question,
        options: s.options,
        messages: s.messages ?? undefined,
      })),
  }));

  return full.sort((a, b) => a.order - b.order);
}

export async function createBundle(
  name: string,
  scenarioIds: number[],
  classId?: number
) {
  if (!db) return null;

  let targetClassId = classId;
  if (!targetClassId) {
    const [classRow] = await db.select({ id: classes.id }).from(classes).limit(1);
    targetClassId = classRow?.id;
  }
  if (!targetClassId) return null;

  const [bundle] = await db
    .insert(scenarioBundles)
    .values({ classId: targetClassId, name, active: true })
    .returning();

  if (!bundle) return null;

  if (scenarioIds.length > 0) {
    await db.insert(bundleScenarios).values(
      scenarioIds.map((id, index) => ({
        bundleId: bundle.id,
        scenarioId: id,
        order: index + 1,
      }))
    );
  }

  return bundle;
}

export async function updateBundle(
  bundleId: number,
  data: { name?: string; active?: boolean; scenarioIds?: number[] }
) {
  if (!db) return null;

  if (data.name !== undefined || data.active !== undefined) {
    await db
      .update(scenarioBundles)
      .set({
        name: data.name,
        active: data.active,
      })
      .where(eq(scenarioBundles.id, bundleId));
  }

  if (data.scenarioIds) {
    await db
      .delete(bundleScenarios)
      .where(eq(bundleScenarios.bundleId, bundleId));
    if (data.scenarioIds.length > 0) {
      await db.insert(bundleScenarios).values(
        data.scenarioIds.map((id, index) => ({
          bundleId: bundleId,
          scenarioId: id,
          order: index + 1,
        }))
      );
    }
  }

  const [row] = await db
    .select()
    .from(scenarioBundles)
    .where(eq(scenarioBundles.id, bundleId))
    .limit(1);
  return row ?? null;
}

export async function createScenarioTemplate(
  data: {
    slug: string;
    title: string;
    category: string;
    summary: string;
    accent?: string;
    steps: Array<{
      key: string;
      title: string;
      order: number;
      situation: string;
      question: string;
      options: Array<{
        id: string;
        label: string;
        feedback: string;
        principle: string;
        riskDelta: number;
        isSafe: boolean;
      }>;
      messages?: Array<{ sender: "user" | "other"; name: string; message: string; timestamp?: string }>;
    }>;
  }
) {
  if (!db) return null;

  const [template] = await db
    .insert(scenarioTemplatesTable)
    .values({
      slug: data.slug,
      title: data.title,
      threatCategory: data.category as ThreatCategory,
      summary: data.summary,
      accent: data.accent || "#EC4899",
    })
    .returning();

  if (!template) return null;

  if (data.steps.length > 0) {
    await db.insert(scenarioSteps).values(
      data.steps.map((step) => ({
        scenarioId: template.id,
        stepKey: step.key,
        title: step.title,
        order: step.order,
        situation: step.situation,
        question: step.question,
        options: step.options,
      }))
    );
  }

  return template;
}

export async function recordScenarioAnswers(input: {
  sessionToken: string;
  answers: Array<{
    scenarioSlug: string;
    stepKey: string;
    selectedOptionId: string;
  }>;
}): Promise<{ success: boolean; attemptIds: string[] }> {
  if (!db || input.answers.length === 0) {
    return { success: false, attemptIds: [] };
  }

  const session = await getOrCreateSession(input.sessionToken);
  if (!session) {
    return { success: false, attemptIds: [] };
  }

  const grouped = new Map<string, typeof input.answers>();
  for (const a of input.answers) {
    const entries = grouped.get(a.scenarioSlug) ?? [];
    entries.push(a);
    grouped.set(a.scenarioSlug, entries);
  }

  const attemptIds: string[] = [];

  for (const [slug, answers] of grouped) {
    const [scenario] = await db
      .select()
      .from(scenarioTemplatesTable)
      .where(eq(scenarioTemplatesTable.slug, slug))
      .limit(1);

    if (!scenario) continue;

    const steps = await db
      .select()
      .from(scenarioSteps)
      .where(eq(scenarioSteps.scenarioId, scenario.id));

    const stepMap = new Map(steps.map((s) => [s.stepKey, s]));

    const [attempt] = await db
      .insert(scenarioAttempts)
      .values({
        sessionId: session.id,
        scenarioId: scenario.id,
        mode: "live",
        score: 0,
      })
      .returning();

    if (!attempt) continue;

    const responses: Array<{
      attemptId: string;
      stepId: number;
      selectedOptionId: string;
      isSafe: boolean;
      riskDelta: number;
    }> = [];

    for (const answer of answers) {
      const step = stepMap.get(answer.stepKey);
      if (!step) continue;

      const option = step.options.find((o) => o.id === answer.selectedOptionId);
      if (!option) continue;

      responses.push({
        attemptId: attempt.id,
        stepId: step.id,
        selectedOptionId: answer.selectedOptionId,
        isSafe: option.isSafe,
        riskDelta: option.riskDelta,
      });
    }

    if (responses.length > 0) {
      await db.insert(scenarioResponses).values(responses);
    }

    const safeCount = responses.filter((r) => r.isSafe).length;
    const answeredCount = responses.length;
    const bachavost = calculateBachavost(answeredCount, safeCount);
    const isCompleted = answeredCount >= steps.length && answeredCount > 0;

    await db
      .update(scenarioAttempts)
      .set({
        score: bachavost,
        completedAt: isCompleted ? new Date() : null,
      })
      .where(eq(scenarioAttempts.id, attempt.id));

    attemptIds.push(attempt.id);
  }

  return { success: true, attemptIds };
}

export async function findUserByEmail(email: string) {
  if (!db) return null;
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user ?? null;
}

export async function getScenarioTemplatesWithSteps(): Promise<
  Array<{
    id: number;
    slug: string;
    title: string;
    category: string;
    summary: string;
    accent: string;
    steps: Array<{
      id: number;
      key: string;
      title: string;
      order: number;
      situation: string;
      question: string;
      options: Array<{
        id: string;
        label: string;
        feedback: string;
        principle: string;
        riskDelta: number;
        isSafe: boolean;
      }>;
      messages?: Array<{ sender: "user" | "other"; name: string; message: string; timestamp?: string }> | null;
    }>;
  }>
> {
  if (!db) return [];

  const templates = await db.select().from(scenarioTemplatesTable);
  const steps = await db.select().from(scenarioSteps);

  return templates.map((template) => ({
    id: template.id,
    slug: template.slug,
    title: template.title,
    category: template.threatCategory,
    summary: template.summary,
    accent: template.accent,
    steps: steps
      .filter((s) => s.scenarioId === template.id)
      .sort((a, b) => a.order - b.order)
      .map((s) => ({
        id: s.id,
        key: s.stepKey,
        title: s.title,
        order: s.order,
        situation: s.situation,
        question: s.question,
        options: s.options,
        messages: s.messages ?? undefined,
      })),
  }));
}

export async function updateScenarioTemplate(
  id: number,
  data: {
    title?: string;
    summary?: string;
    accent?: string;
  }
) {
  if (!db) return null;
  const [updated] = await db
    .update(scenarioTemplatesTable)
    .set(data)
    .where(eq(scenarioTemplatesTable.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteScenarioTemplate(id: number) {
  if (!db) return null;
  const [deleted] = await db
    .delete(scenarioTemplatesTable)
    .where(eq(scenarioTemplatesTable.id, id))
    .returning({
      id: scenarioTemplatesTable.id,
      title: scenarioTemplatesTable.title,
    });
  return deleted ?? null;
}

export async function updateScenarioStep(
  id: number,
  data: {
    title?: string;
    situation?: string;
    question?: string;
    options?: Array<{
      id: string;
      label: string;
      feedback: string;
      principle: string;
      riskDelta: number;
      isSafe: boolean;
    }>;
    messages?: Array<{ sender: "user" | "other"; name: string; message: string; timestamp?: string }> | null;
  }
) {
  if (!db) return null;
  const [updated] = await db
    .update(scenarioSteps)
    .set(data)
    .where(eq(scenarioSteps.id, id))
    .returning();
  return updated ?? null;
}
