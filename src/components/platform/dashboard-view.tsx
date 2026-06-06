"use client";

import { useEffect, useState } from "react";
import { BarChart3, CheckCircle2, FileDown, TrendingDown, Users } from "lucide-react";

import { BellCurveChart } from "@/components/platform/bell-curve-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

  const averageImprovement = Math.round(
    overview.categories.reduce((total, item) => total + item.improvement, 0) /
      overview.categories.length
  );
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Zdroj dát"
          value="Anonymné"
          detail="bez osobnych zaznamov"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Dokoncenie"
          value={`${overview.completionRate}%`}
          detail="triedny priemer"
        />
        <MetricCard
          icon={BarChart3}
          label="Priemerna bachavost"
          value={`${overview.averageBachavost}/5`}
          detail="napriec ziackymi vysledkami"
        />
        <MetricCard
          icon={TrendingDown}
          label="Posun"
          value={`${averageImprovement}%`}
          detail="pokles rizikovych reakcii"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Ciel pilotu"
          value={`${overview.targetReduction}%`}
          detail="minimalny ciel"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="rounded-lg">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <Badge className="mb-3 bg-primary text-primary-foreground">
                Skolsky dashboard
              </Badge>
              <CardTitle className="font-heading text-3xl font-bold">
                Gausova krivka bachavosti
              </CardTitle>
              <CardDescription>
                Rozlozenie anonymnych vysledkov na skale od 0 do 5 bodov.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <FileDown data-icon="inline-start" />
              Export
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            <BellCurveChart distribution={overview.scoreDistribution} />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-secondary px-4 py-3">
                <p className="text-xs uppercase text-muted-foreground">
                  Priemer
                </p>
                <p className="font-heading text-3xl font-bold text-primary">
                  {overview.averageBachavost}/5
                </p>
              </div>
              <div className="rounded-xl bg-[#FFF4FA] px-4 py-3">
                <p className="text-xs uppercase text-muted-foreground">
                  Rozloženie
                </p>
                <p className="font-heading text-3xl font-bold text-[#BE185D]">
                  Gausova krivka
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Vrchol ukazuje najčastejšie pásmo bachavosti.
                </p>
              </div>
              <div className="rounded-xl bg-[#F3F0FF] px-4 py-3">
                <p className="text-xs uppercase text-muted-foreground">
                  Najsilnejsi bod
                </p>
                <p className="font-heading text-3xl font-bold text-[#7C3AED]">
                  {overview.scoreDistribution.reduce((best, bucket) =>
                    bucket.count > best.count ? bucket : best
                  ).label}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-lg border-[#EC4899]/20 bg-[#FFF4FA]">
            <CardHeader>
              <CardTitle className="font-heading text-2xl font-bold">
                Najrizikovejšie oblasti
              </CardTitle>
              <CardDescription>Priorita pre ďalšiu triednicku hodinu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {overview.riskAreas.map((area) => (
                <div key={area} className="rounded-md bg-white px-3 py-2 text-sm">
                  {area}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="font-heading text-2xl font-bold">
                Pilotný trend
              </CardTitle>
              <CardDescription>
                Rizikové reakcie klesajú, offline aktivita rastie.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {overview.timeline.map((point) => (
                <div key={point.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{point.label}</span>
                    <span className="text-muted-foreground">
                      {point.unsafeRate}% / {point.offlineActivity}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Progress
                      value={point.unsafeRate}
                      className="[&_[data-slot=progress-indicator]]:bg-[#FF6B6B]"
                    />
                    <Progress
                      value={point.offlineActivity}
                      className="[&_[data-slot=progress-indicator]]:bg-[#0F766E]"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="font-heading text-3xl font-bold">
            Chybovost podla kategorie hrozby
          </CardTitle>
          <CardDescription>
            Agregovane hodnoty bez individualnych zaznamov ziakov.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategoria</TableHead>
                  <TableHead>Chybovost</TableHead>
                  <TableHead>Posun</TableHead>
                  <TableHead className="text-right">Odpovede</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.categories.map((category) => (
                  <TableRow key={category.category}>
                    <TableCell className="font-medium">{category.label}</TableCell>
                    <TableCell>
                      <div className="flex min-w-44 items-center gap-3">
                        <Progress
                          value={category.errorRate}
                          className="[&_[data-slot=progress-indicator]]:bg-[#FF6B6B]"
                        />
                        <span className="w-10 text-sm tabular-nums">
                          {category.errorRate}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-[#0F766E]/30 text-[#0F766E]"
                      >
                        -{category.improvement}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
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

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <Icon className="mb-4 size-5 text-[#EC4899]" />
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-heading text-4xl font-bold text-primary">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
