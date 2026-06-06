import { BadgeCheck, QrCode, ShieldCheck, TrendingDown } from "lucide-react";

const metrics = [
  { label: "QR vstup", value: "bez loginu", icon: QrCode, accent: "#EC4899" },
  { label: "Pilot", value: "5 škôl / 8 týždňov", icon: BadgeCheck, accent: "#7C3AED" },
  { label: "Cieľ", value: "-25% chybovosť", icon: TrendingDown, accent: "#0F766E" },
  { label: "Výstup", value: "anonymný dashboard", icon: ShieldCheck, accent: "#4C1D95" },
];

export function MetricStrip() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <div
            key={metric.label}
            className="group relative overflow-hidden rounded-xl border border-border bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md"
          >
            <div
              className="absolute inset-x-0 top-0 h-[2px]"
              style={{ backgroundColor: metric.accent }}
            />
            <div
              className="mb-4 inline-flex size-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${metric.accent}12`, color: metric.accent }}
            >
              <Icon className="size-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {metric.label}
            </p>
            <p className="mt-1 font-heading text-xl font-bold text-foreground">
              {metric.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
