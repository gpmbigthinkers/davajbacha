import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Fingerprint,
  MessageSquareWarning,
} from "lucide-react";

import { getHomepageStats } from "@/lib/platform-repository";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HeroScene } from "@/components/reactbits/hero-scene";
import { MagicBento } from "@/components/reactbits/magic-bento";
import { ShinyText } from "@/components/reactbits/shiny-text";
import { MetricStrip } from "@/components/platform/metric-strip";
import { cn } from "@/lib/utils";

const bentoItems = [
  {
    title: "Nácvik pred incidentom",
    description:
      "Žiaci reagujú na realistické situácie v bezpečnom prostredí a dostanú spätnú väzbu hneď po rozhodnutí.",
    stat: "10",
    tone: "violet" as const,
  },
  {
    title: "Anonymné meranie",
    description:
      "Škola vidí iba triedne agregácie, nie individuálne profily ani mená.",
    stat: "0",
    tone: "teal" as const,
  },
  {
    title: "Pilotný cieľ",
    description:
      "Redukcia chybovosti o minimálne 25 percent v opakovaných scenároch.",
    stat: "25%",
    tone: "pink" as const,
  },
  {
    title: "Bez inštalácie",
    description:
      "Prístup cez QR kód priamo v prehliadači, bez novej infraštruktúry pre školu.",
    tone: "coral" as const,
  },
];

export default async function Home() {
  const stats = await getHomepageStats();

  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-[760px] overflow-hidden lg:min-h-[820px]">
        <HeroScene />
        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 text-white">
          <Link
            href="/"
            className="rounded-md font-heading text-3xl font-bold outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            DAVAJ-BACHA
          </Link>
          <Link
            href="/platform?presentation=1"
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "h-10 bg-white/92 text-primary hover:bg-white"
            )}
          >
            Otvoriť platformu
            <ArrowRight data-icon="inline-end" />
          </Link>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl px-5 pb-28 pt-24 text-white lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] lg:pb-32 lg:pt-28">
          <div className="max-w-3xl">
            <Badge className="mb-6 w-fit bg-white/15 text-white ring-1 ring-white/25">
              <ShinyText>Ideathon 2026 | GPM Park mládeže Košice</ShinyText>
            </Badge>
            <h1 className="font-heading text-6xl font-bold leading-none md:text-7xl xl:text-8xl">
              DAVAJ-BACHA
            </h1>
            <p className="mt-7 max-w-2xl text-xl leading-9 text-white/82">
              Diagnostická a vzdelávacia platforma, ktorá žiakov naučí reagovať
              na online hrozby skôr, než príde skutočný incident.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/scenar?presentation=1"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 bg-[#EC4899] hover:bg-[#DB2777]"
                )}
              >
                Spustiť scenár
                <MessageSquareWarning data-icon="inline-end" />
              </Link>
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 border-white/45 bg-white/10 text-white hover:bg-white hover:text-primary"
                )}
              >
                Vidieť dashboard
              </Link>
            </div>
          </div>
          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </section>

      {/* Metrics */}
      <section className="relative z-20 mx-auto max-w-7xl px-5 pt-16 pb-8">
        <MetricStrip />
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-7xl px-5">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Problem + Bento */}
      <section className="mx-auto mt-20 max-w-7xl px-5 py-16">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="pt-2">
            <Badge
              variant="outline"
              className="mb-6 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider"
            >
              Problém
            </Badge>
            <h2 className="font-heading text-5xl font-bold leading-tight text-primary">
              Školy zistia zlyhanie až po incidente.
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Bezpečnosť online sa často vysvetľuje prednáškou, ktorá neoverí,
              či žiak vie reagovať na grooming, phishing, deepfake alebo
              kyberšikanu. DAVAJ-BACHA mení prevenciu na merateľný tréning.
            </p>
          </div>
          <MagicBento items={bentoItems} />
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-7xl px-5">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Core Modules */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="mb-12 max-w-3xl">
          <Badge className="mb-4 bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
            Core moduly
          </Badge>
          <h2 className="font-heading text-4xl font-bold text-primary">
            Jedna hodina, tri výstupy.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            QR vstup, dve žiacke aktivity a školský výstup pripravený na pilotnú
            prezentáciu.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <ModuleCard
            icon={MessageSquareWarning}
            title="Simulátor scenárov"
            description="Desať scenárov pokrývajúcich grooming, phishing, deepfake manipuláciu a kyberšikanu. Okamžitá spätná väzba bez moralizovania."
            stat="10 scenárov"
          />
          <ModuleCard
            icon={Fingerprint}
            title="Digitálna stopa"
            description="Model verejného profilu, ktorý ukáže, čo sa dá odvodiť z bežných príspevkov. Porovnanie bezpečného a rizikového profilu."
            stat="5 signálov"
          />
          <ModuleCard
            icon={BarChart3}
            title="Školský dashboard"
            description="Agregovaný triedný pohľad na chybovosť, posun a rizikové oblasti. Auditovateľný výstup priamo použiteľný v správach."
            stat="100% anonymné"
          />
        </div>
      </section>

      {/* Impact Strip */}
      <section className="bg-muted/50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-8 md:grid-cols-3">
            <ImpactItem
              value={`${stats.reduction}%`}
              label="Redukcia chybovosti"
              description="Cieľová hodnota pilotného overenia v opakovaných scenároch."
            />
            <ImpactItem
              value={`${stats.sessions}`}
              label="Anonymných session"
              description="Vzorka pilotného testovania bez individuálnych záznamov."
            />
            <ImpactItem
              value={`${stats.completion}%`}
              label="Dokončenie scenárov"
              description="Triedny priemer dokončených aktivít počas jednej hodiny."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="bg-primary text-white">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
            <div>
              <h3 className="font-heading text-3xl font-bold">
                DAVAJ-BACHA
              </h3>
              <p className="mt-4 max-w-md leading-7 text-white/70">
                Diagnostická a vzdelávacia platforma pre online bezpečnosť
                žiakov. Vyvinuté v rámci Ideathon 2026 — GPM Park mládeže
                Košice.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/scenar?presentation=1"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                    "bg-white text-primary hover:bg-white/90"
                  )}
                >
                  Otvoriť platformu
                </Link>
                <a
                  href="https://github.com/your-org/davajbacha"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "border-white/30 text-white hover:bg-white/10"
                  )}
                >
                  GitHub
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-1"
                  >
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/50">
                Moduly
              </h4>
              <ul className="mt-4 space-y-3 text-white/75">
                <li>
                  <Link
                    href="/scenar?presentation=1"
                    className="inline-flex items-center gap-2 transition hover:text-white"
                  >
                    Simulátor scenárov
                    <ExternalLink className="size-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/digitalna-stopa?presentation=1"
                    className="inline-flex items-center gap-2 transition hover:text-white"
                  >
                    Digitálna stopa
                    <ExternalLink className="size-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 transition hover:text-white"
                  >
                    Školský dashboard
                    <ExternalLink className="size-3.5" />
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/50">
                Kontakt
              </h4>
              <ul className="mt-4 space-y-3 text-white/75">
                <li>
                  <a
                    href="mailto:team@davajbacha.sk"
                    className="transition hover:text-white"
                  >
                    team@davajbacha.sk
                  </a>
                </li>
                <li className="text-sm text-white/40">
                  © 2026 DAVAJ-BACHA
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ModuleCard({
  icon: Icon,
  title,
  description,
  stat,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  stat: string;
}) {
  return (
    <Card className="group overflow-hidden rounded-xl border-border/60 transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-[#EC4899]/10">
          <Icon className="size-5 text-[#EC4899]" />
        </div>
        <CardTitle className="font-heading text-2xl font-bold">
          {title}
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <CheckCircle2 className="size-4 text-[#0F766E]" />
          {stat}
        </div>
      </CardContent>
    </Card>
  );
}

function ImpactItem({
  value,
  label,
  description,
}: {
  value: string;
  label: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-start">
      <span className="font-heading text-5xl font-bold text-primary">
        {value}
      </span>
      <span className="mt-2 text-lg font-semibold text-foreground">
        {label}
      </span>
      <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
