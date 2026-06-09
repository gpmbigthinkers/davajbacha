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
const BASELINE_Y = PADDING_TOP + (VIEWBOX_HEIGHT - PADDING_TOP - PADDING_BOTTOM);

function buildLinePath(points: Point[]) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  const tension = 0.5;
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;

    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension * 2;
    const cp1y = Math.min(
      BASELINE_Y,
      p1.y + ((p2.y - p0.y) / 6) * tension * 2,
    );
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension * 2;
    const cp2y = Math.min(
      BASELINE_Y,
      p2.y - ((p3.y - p1.y) / 6) * tension * 2,
    );

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

  const points = distribution.map((bucket, index) => ({
    x: PADDING_X + stepX * index,
    y:
      PADDING_TOP +
      innerHeight -
      (bucket.count / maxCount) * innerHeight,
  }));

  const linePath = buildLinePath(points);

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
          y1={VIEWBOX_HEIGHT - PADDING_BOTTOM}
          x2={VIEWBOX_WIDTH - PADDING_X}
          y2={VIEWBOX_HEIGHT - PADDING_BOTTOM}
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="1"
        />

        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="#4C1D95"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
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
