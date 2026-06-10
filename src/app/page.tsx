import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BadgeCheck,
  ExternalLink,
  Fingerprint,
  MessageSquareWarning,
  QrCode,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";

import { getHomepageStats } from "@/lib/platform-repository";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { HeroScene, PhoneMockup } from "@/components/reactbits/hero-scene";
import { ShinyText } from "@/components/reactbits/shiny-text";
import { cn } from "@/lib/utils";

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
            href="/scenar"
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "h-10 bg-white/92 text-primary hover:bg-white"
            )}
          >
            Otvoriť platformu
            <ArrowRight data-icon="inline-end" />
          </Link>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 pb-28 pt-24 text-white lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:gap-8 lg:pb-32 lg:pt-28">
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
                href="/scenar"
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
          <div className="relative hidden lg:flex lg:items-center lg:justify-center lg:self-stretch">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* Unified Value Proposition */}
      <section className="relative z-20 mx-auto max-w-7xl px-5 pt-16 pb-20">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "QR vstup", value: "bez loginu", icon: QrCode },
            { label: "Pilot", value: "5 škôl / 8 týždňov", icon: BadgeCheck },
            { label: "Cieľ", value: "-25% chybovosť", icon: TrendingDown },
            { label: "Výstup", value: "anonymný dashboard", icon: ShieldCheck },
          ].map((metric) => (
            <div
              key={metric.label}
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-primary/20 group-hover:bg-primary/40 transition-colors" />
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-primary/[0.06] text-primary">
                <metric.icon className="size-5" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {metric.label}
              </p>
              <p className="mt-1 font-heading text-xl font-bold text-foreground">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem → Solution Flow */}
      <section className="border-t border-border/60 bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-5">
          {/* Header */}
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              Prečo DAVAJ-BACHA
            </span>
            <h2 className="font-heading text-4xl font-bold leading-tight text-foreground">
              Školy zistia zlyhanie až po incidente.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Bezpečnosť online sa často vysvetľuje prednáškou, ktorá neoverí,
              či žiak vie reagovať na grooming, phishing, deepfake alebo
              kyberšikanu. DAVAJ-BACHA mení prevenciu na merateľný tréning.
            </p>
          </div>

          {/* Feature row */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: MessageSquareWarning,
                title: "Nácvik pred incidentom",
                desc: "Žiaci reagujú na realistické situácie v bezpečnom prostredí.",
              },
              {
                icon: ShieldCheck,
                title: "Anonymné meranie",
                desc: "Triedne agregácie bez individuálnych profilov ani mien.",
              },
              {
                icon: TrendingDown,
                title: "Merateľný cieľ",
                desc: "Redukcia chybovosti o minimálne 25 % v opakovaných scenároch.",
              },
              {
                icon: QrCode,
                title: "Bez inštalácie",
                desc: "Prístup cez QR kód priamo v prehliadači, žiadna infraštruktúra.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group relative rounded-xl border border-border/60 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-primary/[0.06]">
                  <item.icon className="size-5 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Modules */}
      <section className="border-t border-border/60 bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              Core moduly
            </span>
            <h2 className="font-heading text-4xl font-bold leading-tight text-foreground">
              Jedna hodina, tri výstupy.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              QR vstup, dve žiacke aktivity a školský výstup pripravený na pilotnú
              prezentáciu.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <div className="group relative rounded-xl border border-border/60 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-primary/[0.06]">
                <MessageSquareWarning className="size-5 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Simulátor scenárov
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Desať scenárov pokrývajúcich grooming, phishing, deepfake manipuláciu a kyberšikanu. Okamžitá spätná väzba bez moralizovania.
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                10 scenárov
              </p>
            </div>
            <div className="group relative rounded-xl border border-border/60 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-primary/[0.06]">
                <Fingerprint className="size-5 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Digitálna stopa
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Model verejného profilu, ktorý ukáže, čo sa dá odvodiť z bežných príspevkov. Porovnanie bezpečného a rizikového profilu.
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                5 signálov
              </p>
            </div>
            <div className="group relative rounded-xl border border-border/60 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-primary/[0.06]">
                <BarChart3 className="size-5 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Školský dashboard
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Agregovaný triedný pohľad na chybovosť, posun a rizikové oblasti. Auditovateľný výstup priamo použiteľný v správach.
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                100% anonymné
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Strip */}
      <section className="bg-muted/50 py-20">
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
                  href="https://github.com/gpmbigthinkers/davajbacha"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                    "bg-white text-primary hover:bg-white/90"
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
