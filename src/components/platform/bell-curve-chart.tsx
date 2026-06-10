import type { BachavostBucket } from "@/lib/platform-types";
import { cn } from "@/lib/utils";

type BellCurveChartProps = {
  distribution: BachavostBucket[];
  highlightScore?: number;
  className?: string;
};

type Point = {
  x: number;
  y: number;
};

const VIEWBOX_WIDTH = 520;
const VIEWBOX_HEIGHT = 240;
const PADDING_X = 32;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 44;
const BASELINE_BOTTOM = VIEWBOX_HEIGHT - PADDING_BOTTOM;

function computeTangents(points: Point[]): number[] {
  const n = points.length;
  const tangents = new Array<number>(n).fill(0);

  if (n === 0) return tangents;

  // Secant slopes between consecutive points
  const m = new Array<number>(n - 1).fill(0);
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    m[i] = dx !== 0 ? dy / dx : 0;
  }

  // Initial tangent estimates (central differences)
  for (let i = 0; i < n; i++) {
    if (i === 0) {
      tangents[i] = m[0] ?? 0;
    } else if (i === n - 1) {
      tangents[i] = m[n - 2] ?? 0;
    } else {
      const a = m[i - 1];
      const b = m[i];
      tangents[i] = a * b <= 0 ? 0 : (a + b) / 2;
    }
  }

  // Fritsch–Carlson monotonicity adjustment
  for (let i = 0; i < n - 1; i++) {
    const s = m[i];
    if (s === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / s;
    const b = tangents[i + 1] / s;
    const sqrt = Math.sqrt(a * a + b * b);
    if (sqrt > 3) {
      const tau = 3 / sqrt;
      tangents[i] = tau * a * s;
      tangents[i + 1] = tau * b * s;
    }
  }

  return tangents;
}

export function buildCurvePath(points: Point[]) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  const m = computeTangents(points);

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const p1 = points[index];
    const p2 = points[index + 1];
    const dx = (p2.x - p1.x) / 6;

    const cp1x = p1.x + dx;
    const cp1y = p1.y + m[index] * dx;
    const cp2x = p2.x - dx;
    const cp2y = p2.y - m[index + 1] * dx;

    path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }

  return path;
}

export function BellCurveChart({
  distribution,
  highlightScore,
  className,
}: BellCurveChartProps) {
  const maxCount = Math.max(...distribution.map((bucket) => bucket.count), 1);
  const innerWidth = VIEWBOX_WIDTH - PADDING_X * 2;
  const innerHeight = VIEWBOX_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const stepX =
    distribution.length > 1 ? innerWidth / (distribution.length - 1) : innerWidth;

  const baselineY = PADDING_TOP + innerHeight;
  const dataBottomY = baselineY - 12;
  const dataTopY = PADDING_TOP + 4;
  const dataHeight = dataBottomY - dataTopY;

  const points = distribution.map((bucket, index) => ({
    x: PADDING_X + stepX * index,
    y: dataBottomY - (bucket.count / maxCount) * dataHeight,
  }));

  const linePath = buildCurvePath(points);

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="Rozlozenie bachavosti"
      >
        <line
          x1={PADDING_X}
          y1={baselineY}
          x2={VIEWBOX_WIDTH - PADDING_X}
          y2={baselineY}
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="1"
        />
        <line
          x1={PADDING_X}
          y1={PADDING_TOP}
          x2={PADDING_X}
          y2={baselineY}
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="1"
        />
        <text
          x={PADDING_X - 8}
          y={baselineY}
          textAnchor="end"
          dominantBaseline="middle"
          className="fill-muted-foreground text-[10px] font-medium tabular-nums opacity-70"
        >
          0
        </text>
        <text
          x={PADDING_X - 8}
          y={PADDING_TOP}
          textAnchor="end"
          dominantBaseline="middle"
          className="fill-muted-foreground text-[10px] font-medium tabular-nums opacity-70"
        >
          {maxCount}
        </text>

        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="#4C1D95"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ) : null}

        {distribution.map((bucket, index) => {
          const point = points[index];
          const active = highlightScore === bucket.score;
          const r = active ? 5 : 3.5;

          return (
            <g key={bucket.score}>
              <circle
                cx={point.x}
                cy={point.y}
                r={r}
                fill={active ? "#4C1D95" : "#FFFFFF"}
                stroke="#4C1D95"
                strokeWidth={active ? 2 : 1.5}
              />
              <text
                x={point.x}
                y={VIEWBOX_HEIGHT - 22}
                textAnchor="middle"
                className="fill-muted-foreground text-[12px] font-medium"
              >
                {bucket.label}
              </text>
              <text
                x={point.x}
                y={VIEWBOX_HEIGHT - 8}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px] tabular-nums opacity-70"
              >
                {bucket.percentage}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
