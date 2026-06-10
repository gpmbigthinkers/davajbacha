import { describe, expect, it } from "vitest";

import { buildCurvePath } from "@/components/platform/bell-curve-chart";

function lastCoord(path: string) {
  const tokens = path.trim().split(/\s+/);
  return { x: Number(tokens[tokens.length - 2]), y: Number(tokens[tokens.length - 1]) };
}

describe("buildCurvePath", () => {
  it("returns an empty path for no points", () => {
    expect(buildCurvePath([])).toBe("");
  });

  it("returns a single move command for one point", () => {
    expect(buildCurvePath([{ x: 10, y: 20 }])).toBe("M 10 20");
  });

  it("starts the path with the first point as a move command", () => {
    const path = buildCurvePath([
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ]);

    expect(path.startsWith("M 0 0")).toBe(true);
  });

  it("ends the path exactly at the last point", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 5 },
      { x: 30, y: 15 },
    ];

    const path = buildCurvePath(points);
    const tail = lastCoord(path);

    expect(tail).toEqual({ x: 30, y: 15 });
  });

  it("uses a cubic bezier segment between every pair of points", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 5 },
      { x: 30, y: 15 },
    ];

    const path = buildCurvePath(points);
    const curveCount = (path.match(/ C /g) ?? []).length;

    expect(curveCount).toBe(points.length - 1);
  });
});
