import { footprintSignals, presentationDashboard, scenarioTemplates, threatLabels } from "@/lib/demo-data";
import type {
  DashboardOverview,
  FootprintInput,
  FootprintRiskSummary,
  ScenarioFeedback,
  ThreatCategory,
} from "@/lib/demo-types";

export function getScenarioFeedback(
  scenarioSlug: string,
  stepKey: string,
  selectedOptionId: string,
  attemptId?: string
): ScenarioFeedback {
  const scenario = scenarioTemplates.find((item) => item.slug === scenarioSlug);
  const step = scenario?.steps.find((item) => item.key === stepKey);
  const option = step?.options.find((item) => item.id === selectedOptionId);

  if (!scenario || !step || !option) {
    throw new Error("Unknown scenario answer");
  }

  return {
    attemptId,
    isSafe: option.isSafe,
    riskDelta: option.riskDelta,
    feedback: option.feedback,
    principle: option.principle,
  };
}

export function calculateFootprintRisk(input: FootprintInput): FootprintRiskSummary {
  const selected = footprintSignals.filter((signal) =>
    input.selectedSignals.includes(signal.id)
  );
  const riskScore = Math.min(
    100,
    selected.reduce((total, signal) => total + signal.risk, 0)
  );

  return {
    riskScore,
    level: riskScore >= 60 ? "vysoke" : riskScore >= 30 ? "stredne" : "nizke",
    derivedRisks: selected.map((signal) => signal.derived),
    safeProfile: footprintSignals
      .filter((signal) => input.selectedSignals.includes(signal.id))
      .map((signal) => signal.safe),
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
      improvement: Math.max(12, 42 - errorRate),
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
    categories,
    riskAreas: categories
      .toSorted((a, b) => b.errorRate - a.errorRate)
      .slice(0, 3)
      .map((category) => `${category.label}: ${category.errorRate}% rizikových reakcií`),
  };
}
