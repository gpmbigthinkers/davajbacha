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

function buildCurvePath(points: Point[]) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    path += ` Q ${current.x} ${current.y} ${midX} ${midY}`;
  }

  const penultimate = points[points.length - 2];
  const last = points[points.length - 1];

  path += ` Q ${penultimate.x} ${penultimate.y} ${last.x} ${last.y}`;

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
