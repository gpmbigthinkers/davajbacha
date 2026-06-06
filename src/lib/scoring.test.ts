import { describe, expect, it } from "vitest";

import { calculateFootprintRisk, getScenarioFeedback } from "@/lib/scoring";

describe("scenario scoring", () => {
  it("returns safe feedback for a correct grooming boundary", () => {
    const feedback = getScenarioFeedback("grooming-chat", "pressure", "boundary");

    expect(feedback.isSafe).toBe(true);
    expect(feedback.riskDelta).toBeLessThan(0);
  });

  it("returns risky feedback for phishing login", () => {
    const feedback = getScenarioFeedback("phishing-login", "link", "login");

    expect(feedback.isSafe).toBe(false);
    expect(feedback.riskDelta).toBeGreaterThan(0);
  });
});

describe("footprint scoring", () => {
  it("summarizes selected public signals into derived risks", () => {
    const summary = calculateFootprintRisk({
      publicName: "student",
      selectedSignals: ["school", "route", "contact"],
    });

    expect(summary.riskScore).toBe(65);
    expect(summary.level).toBe("vysoke");
    expect(summary.derivedRisks).toHaveLength(3);
  });
});
