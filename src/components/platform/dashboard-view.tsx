"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, ShieldCheck, TrendingDown, Users } from "lucide-react";

import { BellCurveChart } from "@/components/platform/bell-curve-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { presentationDashboard } from "@/lib/platform-data";
import type { DashboardOverview } from "@/lib/platform-types";

export function DashboardView({
  initialOverview = presentationDashboard,
}: {
  initialOverview?: DashboardOverview;
}) {
  const [overview, setOverview] = useState(initialOverview);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        const data = (await response.json()) as DashboardOverview;

        if (active) {
          setOverview(data);
        }
      } catch {
        if (active) {
          setOverview(initialOverview);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [initialOverview]);

  const averageImprovement = useMemo(() => {
    if (overview.categories.length === 0) return 0;
    return Math.round(
      overview.categories.reduce((total, item) => total + item.improvement, 0) /
        overview.categories.length
    );
  }, [overview.categories]);

  const peakBucket = useMemo(() => {
    if (overview.scoreDistribution.length === 0) return null;
    return overview.scoreDistribution.reduce((best, bucket) =>
      bucket.count > best.count ? bucket : best
    );
  }, [overview.scoreDistribution]);

  return (
    <div className="space-y-10">
      <KpiStrip
        completionRate={overview.completionRate}
        averageBachavost={overview.averageBachavost}
        averageImprovement={averageImprovement}
        targetReduction={overview.targetReduction}
        sampleSize={overview.sampleSize}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
        <Card className="border-border/60 bg-card">
          <CardHeader className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Distribúcia odpovedí
            </p>
            <CardTitle className="font-heading text-2xl font-bold">
              Rozloženie skóre 0 – 5
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {peakBucket
                ? `Najčastejšie pásmo ${peakBucket.label}/5 (${peakBucket.percentage} % žiakov).`
                : "Zatiaľ bez dát."}
            </p>
          </CardHeader>
          <CardContent>
            <BellCurveChart distribution={overview.scoreDistribution} />
            <p className="mt-2 text-xs text-muted-foreground">
              Vyššie skóre znamená bezpečnejšiu reakciu. Krivka by sa mala
              posúvať doprava s postupujúcim pilotom.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <KeyFindings areas={overview.riskAreas} />
          <PilotTrend timeline={overview.timeline} />
        </div>
      </div>

      <Card className="border-border/60 bg-card">
        <CardHeader className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Chybovosť
          </p>
          <CardTitle className="font-heading text-2xl font-bold">
            Podľa kategórie hrozby
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Agregované hodnoty bez individuálnych záznamov žiakov.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Kategória
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Chybovosť
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Posun
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Odpovede
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.categories.map((category) => (
                <TableRow key={category.category} className="hover:bg-transparent">
                  <TableCell className="py-3 font-medium text-foreground">
                    {category.label}
                  </TableCell>
                  <TableCell className="py-3">
                    <CategoryBar value={category.errorRate} />
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      variant="outline"
                      className="rounded-md border-border/60 px-1.5 py-0 text-xs font-medium text-foreground"
                    >
                      −{category.improvement}%
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right text-sm tabular-nums text-muted-foreground">
                    {category.responses}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiStrip({
  completionRate,
  averageBachavost,
  averageImprovement,
  targetReduction,
  sampleSize,
}: {
  completionRate: number;
  averageBachavost: number;
  averageImprovement: number;
  targetReduction: number;
  sampleSize: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 md:grid-cols-4">
      <KpiTile
        icon={Users}
        label="Anonymné session"
        value={sampleSize.toString()}
        unit="pilotná vzorka"
      />
      <KpiTile
        icon={CheckCircle2}
        label="Dokončenie"
        value={`${completionRate}%`}
        unit="triedny priemer"
      />
      <KpiTile
        icon={ShieldCheck}
        label="Priemerná bačavosť"
        value={`${averageBachavost.toFixed(1)}/5`}
        unit="vyššie = bezpečnejšie"
      />
      <KpiTile
        icon={BarChart3}
        label="Posun v pilotnom cykle"
        value={`−${averageImprovement}%`}
        unit={`cieľ: −${targetReduction}%`}
        positive
      />
    </div>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  unit,
  positive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  unit: string;
  positive?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
        <Icon
          className={`size-4 ${positive ? "text-emerald-700" : "text-muted-foreground"}`}
        />
      </div>
      <span className="font-heading text-3xl font-bold tabular-nums text-foreground">
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{unit}</span>
    </div>
  );
}

function CategoryBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-1.5 w-32 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <span className="w-10 text-sm tabular-nums text-foreground">{value}%</span>
    </div>
  );
}

function KeyFindings({ areas }: { areas: string[] }) {
  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Kľúčové zistenia
        </p>
        <CardTitle className="font-heading text-xl font-bold">
          Najrizikovejšie oblasti
        </CardTitle>
      </CardHeader>
      <CardContent>
        {areas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Zatiaľ bez identifikovaných rizikových oblastí.
          </p>
        ) : (
          <ol className="space-y-3">
            {areas.map((area, index) => (
              <li key={area} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-0.5 font-heading text-sm font-semibold tabular-nums text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-foreground/90">{area}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function PilotTrend({
  timeline,
}: {
  timeline: DashboardOverview["timeline"];
}) {
  if (timeline.length === 0) {
    return (
      <Card className="border-border/60 bg-card">
        <CardHeader className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Pilotný trend
          </p>
          <CardTitle className="font-heading text-xl font-bold">
            Rizikové reakcie v čase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Zatiaľ nie je k dispozícii dostatok dát na zobrazenie trendu.
          </p>
        </CardContent>
      </Card>
    );
  }

  const points = timeline.map((point, index) => ({
    x: timeline.length === 1 ? 50 : (index / (timeline.length - 1)) * 100,
    unsafeRate: point.unsafeRate,
    label: point.label,
  }));
  const maxValue = Math.max(...points.map((p) => p.unsafeRate), 1);
  const linePath = points
    .map((point, index) => {
      const x = point.x;
      const y = 100 - (point.unsafeRate / maxValue) * 100;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Pilotný trend
        </p>
        <CardTitle className="font-heading text-xl font-bold">
          Rizikové reakcie v čase
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Nižšie percento znamená lepšiu triedu.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-20 w-full text-foreground"
          aria-hidden="true"
        >
          <line
            x1="0"
            y1="100"
            x2="100"
            y2="100"
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeWidth="0.5"
          />
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <ul className="space-y-2 text-sm">
          {timeline.map((point) => (
            <li
              key={point.label}
              className="flex items-center justify-between text-foreground/90"
            >
              <span className="text-muted-foreground">{point.label}</span>
              <span className="flex items-center gap-2 font-medium tabular-nums">
                <TrendingDown className="size-3.5 text-muted-foreground" />
                {point.unsafeRate}%
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
