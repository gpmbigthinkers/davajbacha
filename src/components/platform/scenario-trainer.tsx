"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  MessageCircle,
  RotateCcw,
  ShieldAlert,
  Trophy,
  User,
} from "lucide-react";

import { BellCurveChart } from "@/components/platform/bell-curve-chart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { useSession } from "@/hooks/use-session";
import { threatLabels } from "@/lib/platform-data";
import { calculateBachavost } from "@/lib/scoring";
import type {
  DashboardOverview,
  ScenarioFeedback,
} from "@/lib/platform-types";
import { cn } from "@/lib/utils";

type ChatMessage = {
  sender: "user" | "other";
  name: string;
  message: string;
  timestamp?: string;
};

type ScenarioOption = {
  id: string;
  label: string;
  feedback: string;
  principle: string;
  riskDelta: number;
  isSafe: boolean;
};

type ScenarioStep = {
  id: number;
  key: string;
  title: string;
  situation: string;
  question: string;
  options: ScenarioOption[];
  messages?: ChatMessage[] | null;
};

type ScenarioTemplate = {
  id: number;
  slug: string;
  title: string;
  category: string;
  summary: string;
  accent: string;
  steps: ScenarioStep[];
};

function hashOptionOrder(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function getDisplayedOptions(
  scenarioSlug: string,
  stepKey: string,
  options: ScenarioOption[]
) {
  if (options.length !== 2) {
    return options;
  }

  const shouldReverse = hashOptionOrder(`${scenarioSlug}:${stepKey}`) % 2 === 1;
  return shouldReverse ? [...options].reverse() : options;
}

export function ScenarioTrainer({ presentationMode = false }: { presentationMode?: boolean }) {
  const searchParams = useSearchParams();
  const entryCode = searchParams.get("code") ?? undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sessionToken = useSession(presentationMode, entryCode);

  const [templates, setTemplates] = useState<ScenarioTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ScenarioFeedback | null>(null);

  const collectedAnswersRef = useRef<
    Array<{ scenarioSlug: string; stepKey: string; selectedOptionId: string }>
  >([]);
  const batchSavedRef = useRef(false);

  // Track score across the whole bundle
  const [answeredCount, setAnsweredCount] = useState(0);
  const [safeCount, setSafeCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [resultOverview, setResultOverview] = useState<DashboardOverview | null>(
    null
  );

  useEffect(() => {
    async function load() {
      try {
        let url = "/api/scenario";
        if (entryCode) {
          // First validate the code to get bundle id
          const codeRes = await fetch(
            `/api/entry-code?code=${encodeURIComponent(entryCode)}`,
            { cache: "no-store" }
          );
          if (codeRes.ok) {
            const codeData = (await codeRes.json()) as { bundleId?: number };
            if (codeData.bundleId) {
              url = `/api/bundle?id=${codeData.bundleId}`;
            }
          }
        }
        const res = await fetch(url, { cache: "no-store" });
        const data = (await res.json()) as ScenarioTemplate[];
        if (Array.isArray(data) && data.length > 0) {
          setTemplates(data);
        }
      } catch {
        // keep empty
      } finally {
        setLoadingTemplates(false);
      }
    }
    load();
  }, [entryCode]);

  useEffect(() => {
    if (!finished) {
      return;
    }

    let active = true;

    async function finishAndSave() {
      if (!batchSavedRef.current && collectedAnswersRef.current.length > 0) {
        batchSavedRef.current = true;
        try {
          await fetch("/api/scenario/answers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              answers: collectedAnswersRef.current,
            }),
          });
        } catch {
          // non-critical — dashboard still loads
        }
      }

      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        const data = (await response.json()) as DashboardOverview;

        if (active) {
          setResultOverview(data);
        }
      } catch {
        if (active) {
          setResultOverview(null);
        }
      }
    }

    finishAndSave();

    return () => {
      active = false;
    };
  }, [finished]);

  const scenario = templates[scenarioIndex];
  const step = scenario?.steps[stepIndex];
  const displayedOptions =
    scenario && step ? getDisplayedOptions(scenario.slug, step.key, step.options) : [];
  const canRevealScenarioMeta = Boolean(selectedOptionId);
  const visibleTemplates = templates.slice(0, scenarioIndex + 1);

  const totalSteps = templates.reduce((sum, t) => sum + t.steps.length, 0);
  const completedSteps = templates
    .slice(0, scenarioIndex)
    .reduce((sum, t) => sum + t.steps.length, 0) + stepIndex;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const currentBachavost = calculateBachavost(answeredCount, safeCount);

  function getLocalFeedback(
    slug: string,
    stepKey: string,
    optionId: string
  ): ScenarioFeedback {
    const sc = templates.find((t) => t.slug === slug);
    const st = sc?.steps.find((s) => s.key === stepKey);
    const opt = st?.options.find((o) => o.id === optionId);
    if (!sc || !st || !opt) {
      throw new Error("Unknown scenario answer");
    }
    return {
      isSafe: opt.isSafe,
      riskDelta: opt.riskDelta,
      feedback: opt.feedback,
      principle: opt.principle,
    };
  }

  function answer(optionId: string) {
    if (selectedOptionId || !scenario || !step) {
      return;
    }

    setSelectedOptionId(optionId);
    const localFeedback = getLocalFeedback(scenario.slug, step.key, optionId);

    setFeedback(localFeedback);

    setAnsweredCount((c) => c + 1);
    if (localFeedback.isSafe) {
      setSafeCount((c) => c + 1);
    }

    collectedAnswersRef.current.push({
      scenarioSlug: scenario.slug,
      stepKey: step.key,
      selectedOptionId: optionId,
    });
  }

  function next() {
    if (!scenario || !step) return;
    const nextStep = stepIndex + 1;

    if (nextStep < scenario.steps.length) {
      setStepIndex(nextStep);
    } else {
      const nextScenario = scenarioIndex + 1;
      if (nextScenario < templates.length) {
        setScenarioIndex(nextScenario);
        setStepIndex(0);
      } else {
        setFinished(true);
        return;
      }
    }

    setSelectedOptionId(null);
    setFeedback(null);
  }

  function reset() {
    setScenarioIndex(0);
    setStepIndex(0);
    setSelectedOptionId(null);
    setFeedback(null);
    setAnsweredCount(0);
    setSafeCount(0);
    setFinished(false);
    setResultOverview(null);
    collectedAnswersRef.current = [];
    batchSavedRef.current = false;
  }

  if (loadingTemplates) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Načítavam scenáre...</p>
      </div>
    );
  }

  if (!scenario || !step) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Žiadne scenáre nie sú k dispozícii.</p>
      </div>
    );
  }

  if (finished) {
    const finalBachavost = calculateBachavost(answeredCount, safeCount);

    return (
      <div className="mx-auto max-w-4xl">
        <Card className="rounded-xl border-[#EC4899]/20">
          <CardHeader className="text-center">
            <Trophy className="mx-auto size-12 text-[#EC4899]" />
            <CardTitle className="font-heading text-3xl font-bold mt-4">
              Scenáre dokončené
            </CardTitle>
            <CardDescription>
              Tu je tvoje skóre za tento balík scenárov.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-secondary p-4">
                <p className="text-xs text-muted-foreground uppercase">Otázok</p>
                <p className="font-heading text-3xl font-bold">{answeredCount}</p>
              </div>
              <div className="rounded-lg bg-[#E7F7F3] p-4">
                <p className="text-xs text-[#0F766E] uppercase">Správne</p>
                <p className="font-heading text-3xl font-bold text-[#0F766E]">{safeCount}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-4">
                <p className="text-xs text-primary uppercase">Bachavosť</p>
                <p className="font-heading text-3xl font-bold text-primary">
                  {finalBachavost}/5
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold">Kde si na Gausovej krivke</p>
                  <p className="text-sm text-muted-foreground">
                    Tvoja bachavosť je vyznačená priamo na anonymnej Gausovej krivke
                    výsledkov.
                  </p>
                </div>
                {resultOverview ? (
                  <BellCurveChart
                    distribution={resultOverview.scoreDistribution}
                    highlightScore={finalBachavost}
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-primary/20 bg-secondary/60 px-4 py-8 text-sm text-muted-foreground">
                    Načítavam porovnanie s bell curve...
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-secondary p-4">
                  <p className="text-xs uppercase text-muted-foreground">
                    Bezpečnostný profil
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {finalBachavost >= 4
                      ? "Rozpoznávaš väčšinu manipulatívnych situácií a reaguješ s odstupom."
                      : finalBachavost >= 3
                      ? "Máš dobrý základ, ale pri tlaku a naliehavosti sa oplatí spomaliť."
                      : "Najviac pomôže zopakovať si spätnú väzbu pri rizikových voľbách."}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FFF4FA] p-4">
                  <p className="text-xs uppercase text-muted-foreground">
                    Tvoja pozícia
                  </p>
                  <p className="mt-2 font-heading text-3xl font-bold text-[#BE185D]">
                    {finalBachavost}/5
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Tvoj výsledok je vyznačený priamo na anonymnej Gausovej
                    krivke.
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={reset} className="w-full">
              <RotateCcw data-icon="inline-start" />
              Spustiť znova
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="font-heading text-2xl font-bold">
              Simulátor rozhodnutí
            </CardTitle>
            <CardDescription>
              {templates.length} scenárov, okamžitá spätná väzba a anonymný
              zápis do analytiky.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress
              value={progress}
              className="[&_[data-slot=progress-indicator]]:bg-[#EC4899]"
            />
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Aktuálna bachavosť
              </p>
              <p className="mt-1 font-heading text-4xl font-bold text-primary">
                {currentBachavost}/5
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Rastie pri bezpečnej reakcii. Po prvom rozhodnutí uvidíš svoje
                priebežné skóre.
              </p>
            </div>
            <div className="space-y-2">
              {visibleTemplates.map((item, index) => (
                <div
                  key={item.slug}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition",
                    index === scenarioIndex
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-white"
                  )}
                >
                  <span>
                    {index === scenarioIndex && !canRevealScenarioMeta
                      ? `Scenár ${index + 1}`
                      : threatLabels[item.category as keyof typeof threatLabels] ??
                        item.category}
                  </span>
                  <ChevronRight className="size-4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </aside>

      <div>
        <Card className="rounded-lg border-primary/15 bg-white/95 shadow-[0_24px_80px_rgba(76,29,149,0.16)]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">
                {threatLabels[scenario.category as keyof typeof threatLabels] ??
                  scenario.category}
              </Badge>
              <Badge variant="outline">
                Krok {stepIndex + 1} / {scenario.steps.length}
              </Badge>
            </div>
            <div>
              <CardTitle className="font-heading text-4xl font-bold">
                {step.title}
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-base leading-7">
                {scenario.summary}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {step.messages && step.messages.length > 0 ? (
              <div className="rounded-lg border bg-[#E8E8ED] p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                  <MessageCircle className="size-4" />
                  Chat
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {step.messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex gap-2",
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.sender === "other" && (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EC4899] text-white">
                          <User className="size-4" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                          msg.sender === "user"
                            ? "bg-[#EC4899] text-white rounded-br-md"
                            : "bg-white text-foreground rounded-bl-md shadow-sm"
                        )}
                      >
                        {msg.sender === "other" && (
                          <p className="mb-0.5 text-xs font-semibold text-[#EC4899]">
                            {msg.name}
                          </p>
                        )}
                        <p>{msg.message}</p>
                        {msg.timestamp && (
                          <p
                            className={cn(
                              "mt-1 text-right text-[10px]",
                              msg.sender === "user"
                                ? "text-white/70"
                                : "text-muted-foreground"
                            )}
                          >
                            {msg.timestamp}
                          </p>
                        )}
                      </div>
                      {msg.sender === "user" && (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                          <User className="size-4" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border bg-secondary/80 p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
                  <ShieldAlert className="size-4" />
                  Situácia
                </div>
                <p className="text-lg leading-8">{step.situation}</p>
              </div>
            )}

            <div>
              <h2 className="font-heading text-2xl font-bold">{step.question}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {displayedOptions.map((option) => {
                  const selected = selectedOptionId === option.id;

                  return (
                    <button
                      key={option.id}
                      className={cn(
                        "min-h-32 rounded-lg border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md disabled:cursor-not-allowed",
                        selected &&
                          (option.isSafe
                            ? "border-[#0F766E] bg-[#E7F7F3]"
                            : "border-[#FF6B6B] bg-[#FFF0F0]")
                      )}
                      disabled={Boolean(selectedOptionId)}
                      onClick={() => answer(option.id)}
                    >
                      <span className="text-base font-semibold leading-6">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {feedback ? (
              <Alert
                className={cn(
                  "rounded-lg",
                  feedback.isSafe
                    ? "border-[#0F766E]/30 bg-[#E7F7F3]"
                    : "border-[#FF6B6B]/30 bg-[#FFF0F0]"
                )}
              >
                {feedback.isSafe ? (
                  <CheckCircle2 className="size-4 text-[#0F766E]" />
                ) : (
                  <AlertTriangle className="size-4 text-[#FF6B6B]" />
                )}
                <AlertTitle>
                  {feedback.isSafe ? "Bezpečná reakcia" : "Riziková reakcia"}
                </AlertTitle>
                <AlertDescription>
                  {feedback.feedback} {feedback.principle}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={!feedback} onClick={next}>
                Ďalší krok
                <ChevronRight data-icon="inline-end" />
              </Button>
              <Button variant="outline" onClick={reset}>
                <RotateCcw data-icon="inline-start" />
                Resetovať
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
