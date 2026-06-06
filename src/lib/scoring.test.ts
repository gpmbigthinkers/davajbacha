import { describe, expect, it } from "vitest";

import {
  buildBachavostDistribution,
  calculateBachavost,
  getScenarioFeedback,
} from "@/lib/scoring";

describe("scenario scoring", () => {
  it("returns safe feedback for a correct grooming boundary", () => {
    const feedback = getScenarioFeedback("grooming-chat", "pressure", "boundary");

    expect(feedback!.isSafe).toBe(true);
    expect(feedback!.riskDelta).toBeLessThan(0);
  });

  it("returns risky feedback for phishing login", () => {
    const feedback = getScenarioFeedback("phishing-login", "link", "login");

    expect(feedback!.isSafe).toBe(false);
    expect(feedback!.riskDelta).toBeGreaterThan(0);
  });
});

describe("bachavost scoring", () => {
  it("maps safe answers to a 0-5 bachavost scale", () => {
    expect(calculateBachavost(5, 0)).toBe(0);
    expect(calculateBachavost(5, 3)).toBe(3);
    expect(calculateBachavost(5, 5)).toBe(5);
  });

  it("builds a score distribution for the bell curve", () => {
    const distribution = buildBachavostDistribution([1, 3, 3, 5]);

    expect(distribution.averageBachavost).toBe(3);
    expect(distribution.scoreDistribution.find((bucket) => bucket.score === 3)?.count).toBe(2);
    expect(distribution.scoreDistribution.find((bucket) => bucket.score === 5)?.percentage).toBe(25);
  });
});
