"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Fingerprint,
  LogIn,
  MessageSquareWarning,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShinyText } from "@/components/reactbits/shiny-text";
import { cn } from "@/lib/utils";

const studentPaths = [
  {
    href: "/scenar",
    title: "Simulátor scenárov",
    description: "Rýchle rozhodnutia, chatové situácie a okamžitá spätná väzba.",
    kicker: "Live challenge",
    accent: "from-[#7C3AED] via-[#5B21B6] to-[#312E81]",
    glow: "shadow-[0_28px_80px_rgba(91,33,182,0.34)]",
    icon: MessageSquareWarning,
    highlights: ["Grooming", "Phishing", "Deepfake", "Kyberšikana"],
  },
  {
    href: "/digitalna-stopa",
    title: "Digitálna stopa",
    description: "Postav svoj profil a hneď uvidíš, čo sa z neho dá vyčítať.",
    kicker: "Profile scan",
    accent: "from-[#EC4899] via-[#DB2777] to-[#9D174D]",
    glow: "shadow-[0_28px_80px_rgba(219,39,119,0.32)]",
    icon: Fingerprint,
    highlights: ["Bio", "Lokácia", "Rodina", "Rutina"],
  },
];

const schoolPath = {
  href: "/dashboard",
  title: "Školský dashboard",
  description: "Agregovaný výstup pre učiteľa, pripravený na diskusiu v triede.",
  kicker: "Teacher view",
  icon: BarChart3,
};

export function Hub({ presentationMode = false }: { presentationMode?: boolean }) {
  const suffix = presentationMode ? "?presentation=1" : "";

  return (
    <Tabs defaultValue="ziak" className="gap-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.96),_rgba(247,240,255,0.94)_42%,_rgba(238,232,255,0.92)_100%)] px-6 py-6 shadow-[0_38px_120px_rgba(76,29,149,0.14)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -left-18 top-10 size-44 rounded-full bg-[#FFD84D]/70 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 size-52 rounded-full bg-[#C4B5FD]/75 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-28 w-56 rotate-[-12deg] rounded-full bg-[#FDA4AF]/55 blur-3xl" />

        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <Badge className="mb-4 border-0 bg-primary px-4 py-1.5 text-primary-foreground shadow-md">
              <ShinyText>Platforma</ShinyText>
            </Badge>
            <h1 className="max-w-4xl font-heading text-5xl font-bold leading-[0.95] text-primary sm:text-6xl lg:text-7xl">
              DAVAJ-BACHA
              <span className="block text-[#BE185D]">game lobby pre triedu</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Jeden vstupný kód, dve žiacke aktivity a školský výstup navrhnuté
              ako rýchly, súťažný a čitateľný zážitok.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <LobbyChip icon={Sparkles} label="Okamžitá spätná väzba" />
              <LobbyChip icon={ScanLine} label="QR alebo kód od učiteľa" />
              <LobbyChip icon={ShieldCheck} label="Anonymný výstup" />
            </div>
          </div>

          <div className="relative w-full max-w-md rounded-[1.75rem] border border-white/80 bg-white/75 p-3 shadow-[0_18px_55px_rgba(76,29,149,0.12)] backdrop-blur xl:mt-1">
            <TabsList className="grid h-auto w-full grid-cols-2 rounded-[1.25rem] bg-[#EEE7FF] p-1.5">
              <TabsTrigger
                value="ziak"
                className="rounded-[1rem] px-4 py-3 text-base font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow"
              >
                Žiak
              </TabsTrigger>
              <TabsTrigger
                value="skola"
                className="rounded-[1rem] px-4 py-3 text-base font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow"
              >
                Škola
              </TabsTrigger>
            </TabsList>
            <div className="mt-3 rounded-[1.25rem] bg-[linear-gradient(135deg,_rgba(76,29,149,0.06),_rgba(236,72,153,0.1))] p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
                Ready to play
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Vyber režim, spusti aktivitu a vstúp cez školský kód bez
                registrácie. Každá voľba je pripravená na mobil aj projektor.
              </p>
            </div>
          </div>
        </div>
      </div>

      <TabsContent value="ziak" className="space-y-6">
        <div className="grid gap-5 xl:grid-cols-[1.3fr_1.3fr_0.9fr]">
          {studentPaths.map((item) => (
            <StudentLobbyCard key={item.href} item={item} suffix={suffix} />
          ))}

          <Card className="overflow-hidden rounded-[1.75rem] border-0 bg-[linear-gradient(160deg,_#FFF7D6,_#FFE3A3)] shadow-[0_24px_70px_rgba(251,191,36,0.22)]">
            <CardHeader className="pb-4">
              <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-white/80 text-[#A16207] shadow-sm">
                <QrCode className="size-7" />
              </div>
              <CardTitle className="font-heading text-3xl font-bold text-[#4A2A00]">
                Vstup cez QR alebo kód
              </CardTitle>
              <CardDescription className="text-base leading-7 text-[#6B4F1D]">
                Trieda sa pripája cez kód od učiteľa. Bez konta, bez čakania,
                iba priamo do aktivity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Najrýchlejší štart" value="z dashboardu alebo z projektora" />
              <InfoRow label="Režim vstupu" value="mobil, tablet aj notebook" />
              <InfoRow label="Výsledok" value="anonymne zapísaný do triedneho výstupu" />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="skola" className="space-y-6">
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden rounded-[1.9rem] border-0 bg-[linear-gradient(135deg,_#261045,_#4C1D95_54%,_#7C3AED)] text-white shadow-[0_30px_90px_rgba(76,29,149,0.35)]">
            <CardHeader className="pb-5">
              <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-white/16 backdrop-blur">
                <schoolPath.icon className="size-7" />
              </div>
              <Badge className="w-fit border-0 bg-white/14 px-3 py-1 text-white/90">
                {schoolPath.kicker}
              </Badge>
              <CardTitle className="mt-4 font-heading text-4xl font-bold">
                {schoolPath.title}
              </CardTitle>
              <CardDescription className="max-w-2xl text-base leading-7 text-white/78">
                {schoolPath.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <TeacherMetric title="Chybové vzorce" text="ktoré situácie robia žiakom najväčší problém" />
              <TeacherMetric title="Bachavosť triedy" text="prehľadný výstup po aktivite bez individuálnych mien" />
              <TeacherMetric title="Diskusné body" text="čo otvoriť na nasledujúcej hodine alebo prevencii" />
            </CardContent>
          </Card>

          <Card className="rounded-[1.9rem] border border-primary/12 bg-[linear-gradient(180deg,_#FFFFFF,_#F7F2FF)] shadow-[0_24px_70px_rgba(76,29,149,0.12)]">
            <CardHeader>
              <Badge className="mb-4 w-fit border-0 bg-primary/10 px-3 py-1 text-primary">
                Učiteľský režim
              </Badge>
              <CardTitle className="font-heading text-3xl font-bold text-primary">
                Spusti dashboard
              </CardTitle>
              <CardDescription className="text-base leading-7">
                Agregovaný pohľad na výsledky triedy s entry kódmi, Gausovou
                krivkou a správou scenárov na jednom mieste.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.4rem] border border-primary/10 bg-white/85 p-4">
                <p className="text-sm font-semibold text-primary">
                  Zobrazujú sa iba súhrnné výstupy
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Bez individuálnych profilov žiakov. Dôraz je na triedny obraz
                  a ďalší krok učiteľa, nie na ranking jednotlivcov.
                </p>
              </div>
              <a
                href={`/dashboard${suffix}`}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-14 w-full rounded-2xl bg-primary text-base shadow-[0_18px_45px_rgba(76,29,149,0.28)] hover:bg-primary/90"
                )}
              >
                Otvoriť dashboard
                <ArrowRight data-icon="inline-end" />
              </a>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function LobbyChip({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-primary shadow-sm backdrop-blur">
      <Icon className="size-4 text-[#EC4899]" />
      <span>{label}</span>
    </div>
  );
}

function StudentLobbyCard({
  item,
  suffix,
}: {
  item: (typeof studentPaths)[number];
  suffix: string;
}) {
  const Icon = item.icon;
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function start() {
    if (!code.trim()) {
      setError("Zadaj vstupný kód.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryCode: code.trim().toUpperCase() }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setError(err.error || "Neplatný alebo neaktívny kód.");
        setLoading(false);
        return;
      }

      const data = (await res.json()) as { sessionToken?: string };
      if (data.sessionToken) {
        router.push(
          `${item.href}?code=${encodeURIComponent(code.trim().toUpperCase())}${suffix ? `&${suffix.slice(1)}` : ""}`
        );
      } else {
        setError("Nepodarilo sa vytvoriť session.");
        setLoading(false);
      }
    } catch {
      setError("Nepodarilo sa pripojiť.");
      setLoading(false);
    }
  }

  return (
    <>
      <Card
        className={cn(
          "group relative overflow-hidden rounded-[1.9rem] border-0 text-white transition duration-300 hover:-translate-y-1.5",
          `bg-gradient-to-br ${item.accent}`,
          item.glow
        )}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-28 w-40 translate-x-10 translate-y-10 rounded-full bg-black/10 blur-2xl" />
        <div className="pointer-events-none absolute right-6 top-6 size-16 rotate-12 rounded-3xl border border-white/20 bg-white/8" />

        <CardHeader className="relative pb-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-white/14 backdrop-blur">
              <Icon className="size-7" />
            </div>
            <Badge className="border-0 bg-white/14 px-3 py-1 text-white/90">
              {item.kicker}
            </Badge>
          </div>
          <CardTitle className="max-w-sm font-heading text-4xl font-bold leading-tight text-white">
            {item.title}
          </CardTitle>
          <CardDescription className="max-w-md text-base leading-7 text-white/80">
            {item.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="relative space-y-5">
          <div className="flex flex-wrap gap-2">
            {item.highlights.map((highlight) => (
              <span
                key={highlight}
                className="rounded-full border border-white/18 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/88"
              >
                {highlight}
              </span>
            ))}
          </div>

          <Button
            size="lg"
            className="h-14 rounded-2xl bg-white text-base font-semibold text-[#24103F] shadow-lg transition group-hover:translate-x-1 hover:bg-white/95"
            onClick={() => setShowModal(true)}
          >
            Spustiť aktivitu
            <ArrowRight data-icon="inline-end" />
          </Button>
        </CardContent>
      </Card>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.42),_rgba(15,23,42,0.84))] px-4 py-8">
          <Card className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border-0 bg-[linear-gradient(135deg,_#1F1147,_#4C1D95_58%,_#DB2777)] text-white shadow-[0_40px_120px_rgba(15,23,42,0.5)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_68%)]" />
            <button
              onClick={() => {
                setShowModal(false);
                setCode("");
                setError("");
                setLoading(false);
              }}
              className="absolute right-5 top-5 rounded-xl bg-white/12 p-2 text-white/80 transition hover:bg-white/18 hover:text-white"
              aria-label="Zatvoriť"
            >
              <X className="size-5" />
            </button>

            <CardHeader className="relative gap-4 pb-4 pr-16">
              <Badge className="w-fit border-0 bg-white/14 px-3 py-1 text-white/90">
                Join screen
              </Badge>
              <CardTitle className="font-heading text-4xl font-bold leading-tight text-white">
                Zadaj vstupný kód
              </CardTitle>
              <CardDescription className="max-w-xl text-base leading-7 text-white/78">
                Pripoj sa do aktivity <strong className="text-white">{item.title}</strong>{" "}
                cez kód od učiteľa a choď rovno do hry.
              </CardDescription>
            </CardHeader>

            <CardContent className="relative grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-white/14 bg-white/10 p-5 backdrop-blur">
                  <Label
                    htmlFor={`entry-code-${item.href}`}
                    className="text-sm font-semibold uppercase tracking-[0.22em] text-white/72"
                  >
                    Vstupný kód
                  </Label>
                  <Input
                    id={`entry-code-${item.href}`}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={8}
                    autoFocus
                    className="mt-3 h-16 rounded-2xl border-white/12 bg-white text-center font-mono text-3xl font-bold tracking-[0.35em] text-[#2E1065] placeholder:tracking-[0.2em] placeholder:text-[#A78BFA]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") start();
                    }}
                  />
                  {error ? (
                    <p className="mt-3 text-sm font-medium text-[#FFE4E6]">{error}</p>
                  ) : (
                    <p className="mt-3 text-sm text-white/72">
                      Kód môžeš zadať z tabule, dashboardu alebo z QR vstupu.
                    </p>
                  )}
                </div>

                <Button
                  className="h-16 w-full rounded-2xl bg-white text-lg font-semibold text-[#24103F] shadow-[0_18px_40px_rgba(15,23,42,0.22)] hover:bg-white/95"
                  disabled={loading}
                  onClick={start}
                >
                  <LogIn data-icon="inline-start" />
                  {loading ? "Pripájam..." : "Začať teraz"}
                </Button>
              </div>

              <div className="grid gap-3">
                <JoinFeature
                  icon={ScanLine}
                  title="Rýchly vstup"
                  text="Žiak nepotrebuje registráciu. Stačí kód a ide sa priamo do aktivity."
                />
                <JoinFeature
                  icon={QrCode}
                  title="QR alternatíva"
                  text="Ak učiteľ premietne QR, trieda sa môže pridať bez ručného prepisovania."
                />
                <JoinFeature
                  icon={ShieldCheck}
                  title="Anonymný výstup"
                  text="Výsledok sa zapisuje do agregovaného prehľadu bez individuálneho profilu."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}

function TeacherMetric({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/12 bg-white/10 p-4 backdrop-blur">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/78">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-white/75">{text}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-[#E9D5FF] bg-white/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7C3AED]">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-[#5B4A2F]">{value}</p>
    </div>
  );
}

function JoinFeature({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/14 bg-white/10 p-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-white/14">
          <Icon className="size-5 text-white" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/78">
          {title}
        </p>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/74">{text}</p>
    </div>
  );
}
