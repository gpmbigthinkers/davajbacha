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
const PADDING_X = 36;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 52;

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
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${VIEWBOX_HEIGHT - PADDING_BOTTOM} L ${points[0].x} ${VIEWBOX_HEIGHT - PADDING_BOTTOM} Z`
      : "";

  return (
    <div className={cn("rounded-2xl border border-primary/10 bg-white p-4", className)}>
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="Rozlozenie bachavosti"
      >
        <defs>
          <linearGradient id="bachavost-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#EC4899" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        <line
          x1={PADDING_X}
          y1={VIEWBOX_HEIGHT - PADDING_BOTTOM}
          x2={VIEWBOX_WIDTH - PADDING_X}
          y2={VIEWBOX_HEIGHT - PADDING_BOTTOM}
          stroke="#E9D5FF"
          strokeWidth="2"
        />

        {distribution.map((bucket, index) => {
          const point = points[index];
          return (
            <line
              key={bucket.score}
              x1={point.x}
              y1={PADDING_TOP}
              x2={point.x}
              y2={VIEWBOX_HEIGHT - PADDING_BOTTOM}
              stroke="#F3E8FF"
              strokeDasharray="4 8"
            />
          );
        })}

        {areaPath ? <path d={areaPath} fill="url(#bachavost-fill)" /> : null}
        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="#7C3AED"
            strokeWidth="5"
            strokeLinecap="round"
          />
        ) : null}

        {distribution.map((bucket, index) => {
          const point = points[index];
          const active = highlightScore === bucket.score;

          return (
            <g key={bucket.score}>
              {active ? (
                <line
                  x1={point.x}
                  y1={point.y}
                  x2={point.x}
                  y2={VIEWBOX_HEIGHT - PADDING_BOTTOM}
                  stroke="#EC4899"
                  strokeWidth="3"
                />
              ) : null}
              <circle
                cx={point.x}
                cy={point.y}
                r={active ? 10 : 7}
                fill={active ? "#EC4899" : "#FFFFFF"}
                stroke={active ? "#BE185D" : "#7C3AED"}
                strokeWidth={active ? 4 : 3}
              />
              <text
                x={point.x}
                y={VIEWBOX_HEIGHT - 18}
                textAnchor="middle"
                className="fill-muted-foreground text-[13px] font-medium"
              >
                {bucket.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
