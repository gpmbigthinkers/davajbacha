import {
  presentationDashboard,
  scenarioTemplates,
  threatLabels,
} from "@/lib/platform-data";
import type {
  BachavostBucket,
  DashboardOverview,
  ScenarioFeedback,
  ThreatCategory,
} from "@/lib/platform-types";

export const MAX_BACHAVOST = 5;

export function getScenarioFeedback(
  scenarioSlug: string,
  stepKey: string,
  selectedOptionId: string,
  attemptId?: string
): ScenarioFeedback | null {
  const scenario = scenarioTemplates.find((item) => item.slug === scenarioSlug);
  const step = scenario?.steps.find((item) => item.key === stepKey);
  const option = step?.options.find((item) => item.id === selectedOptionId);

  if (!scenario || !step || !option) {
    return null;
  }

  return {
    attemptId,
    isSafe: option.isSafe,
    riskDelta: option.riskDelta,
    feedback: option.feedback,
    principle: option.principle,
  };
}

export function calculateBachavost(totalAnswers: number, safeAnswers: number) {
  if (totalAnswers <= 0) {
    return 0;
  }

  const normalized = (safeAnswers / totalAnswers) * MAX_BACHAVOST;
  return Math.max(0, Math.min(MAX_BACHAVOST, Math.round(normalized)));
}

export function buildBachavostDistribution(scores: number[]): {
  averageBachavost: number;
  scoreDistribution: BachavostBucket[];
} {
  const total = scores.length;
  const buckets = Array.from({ length: MAX_BACHAVOST + 1 }, (_, score) => {
    const count = scores.filter((item) => item === score).length;
    return {
      score,
      label: `${score}`,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });

  const weightedTotal = buckets.reduce(
    (sum, bucket) => sum + bucket.score * bucket.count,
    0
  );

  return {
    averageBachavost:
      total > 0
        ? Math.round((weightedTotal / total) * 10) / 10
        : 0,
    scoreDistribution: buckets,
  };
}

export function summarizeDashboardFromResponses(
  rows: Array<{ category: ThreatCategory; isSafe: boolean }>,
  sessionCount: number
): DashboardOverview {
  if (rows.length === 0) {
    return presentationDashboard;
  }

  const categories = Object.entries(threatLabels).map(([category, label]) => {
    const scoped = rows.filter((row) => row.category === category);
    const unsafe = scoped.filter((row) => !row.isSafe).length;
    const errorRate = scoped.length > 0 ? Math.round((unsafe / scoped.length) * 100) : 0;

    return {
      category: category as ThreatCategory,
      label,
      errorRate,
      improvement: 0,
      responses: scoped.length,
    };
  });

  const averageUnsafe =
    categories.reduce((total, category) => total + category.errorRate, 0) /
    categories.length;

  return {
    ...presentationDashboard,
    updatedAt: new Date().toISOString(),
    sampleSize: Math.max(sessionCount, presentationDashboard.sampleSize),
    completionRate: Math.min(96, Math.max(72, Math.round(100 - averageUnsafe / 2))),
    averageBachavost: presentationDashboard.averageBachavost,
    categories,
    riskAreas: categories
      .toSorted((a, b) => b.errorRate - a.errorRate)
      .slice(0, 3)
      .map((category) => `${category.label}: ${category.errorRate}% rizikových reakcií`),
  };
}
