"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";

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
import { TiltedCard } from "@/components/reactbits/tilted-card";
import { useDemoSession } from "@/hooks/use-demo-session";
import { scenarioTemplates, threatLabels } from "@/lib/demo-data";
import { getScenarioFeedback } from "@/lib/scoring";
import type { ScenarioFeedback } from "@/lib/demo-types";
import { cn } from "@/lib/utils";

export function ScenarioTrainer({ presentationMode = false }: { presentationMode?: boolean }) {
  const sessionToken = useDemoSession(presentationMode);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ScenarioFeedback | null>(null);
  const [attemptId, setAttemptId] = useState<string | undefined>();
  const [riskScore, setRiskScore] = useState(48);
  const [isPending, startTransition] = useTransition();

  const scenario = scenarioTemplates[scenarioIndex];
  const step = scenario.steps[stepIndex];
  const progress =
    ((scenarioIndex + stepIndex / scenario.steps.length) / scenarioTemplates.length) *
    100;

  function answer(optionId: string) {
    if (selectedOptionId) {
      return;
    }

    setSelectedOptionId(optionId);
    const localFeedback = getScenarioFeedback(
      scenario.slug,
      step.key,
      optionId,
      attemptId
    );
    setFeedback(localFeedback);
    setRiskScore((current) =>
      Math.max(0, Math.min(100, current + localFeedback.riskDelta))
    );

    startTransition(async () => {
      if (!sessionToken) {
        return;
      }

      try {
        const response = await fetch("/api/demo/scenario/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionToken,
            scenarioSlug: scenario.slug,
            stepKey: step.key,
            selectedOptionId: optionId,
            attemptId,
          }),
        });
        const data = (await response.json()) as ScenarioFeedback;

        if (data.attemptId) {
          setAttemptId(data.attemptId);
        }
      } catch {
        setAttemptId((current) => current ?? crypto.randomUUID());
      }
    });
  }

  function next() {
    const nextStep = stepIndex + 1;

    if (nextStep < scenario.steps.length) {
      setStepIndex(nextStep);
    } else {
      setScenarioIndex((current) => (current + 1) % scenarioTemplates.length);
      setStepIndex(0);
      setAttemptId(undefined);
    }

    setSelectedOptionId(null);
    setFeedback(null);
  }

  function reset() {
    setScenarioIndex(0);
    setStepIndex(0);
    setSelectedOptionId(null);
    setFeedback(null);
    setAttemptId(undefined);
    setRiskScore(48);
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
              5 hrozieb, okamžitá spätná väzba a anonymný zápis do analytiky.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress
              value={progress}
              className="[&_[data-slot=progress-indicator]]:bg-[#EC4899]"
            />
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Aktuálne riziko
              </p>
              <p className="mt-1 font-heading text-4xl font-bold text-primary">
                {riskScore}%
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Klesá pri bezpečnej reakcii, rastie pri impulzívnej voľbe.
              </p>
            </div>
            <div className="space-y-2">
              {scenarioTemplates.map((item, index) => (
                <button
                  key={item.slug}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition",
                    index === scenarioIndex
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-white hover:bg-secondary"
                  )}
                  onClick={() => {
                    setScenarioIndex(index);
                    setStepIndex(0);
                    setSelectedOptionId(null);
                    setFeedback(null);
                    setAttemptId(undefined);
                  }}
                >
                  <span>{threatLabels[item.category]}</span>
                  <ChevronRight className="size-4" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </aside>

      <TiltedCard>
        <Card className="rounded-lg border-primary/15 bg-white/95 shadow-[0_24px_80px_rgba(76,29,149,0.16)]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">
                {threatLabels[scenario.category]}
              </Badge>
              <Badge variant="outline">
                Krok {stepIndex + 1} / {scenario.steps.length}
              </Badge>
              {isPending ? <Badge variant="secondary">ukladám</Badge> : null}
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
            <div className="rounded-lg border bg-secondary/80 p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
                <ShieldAlert className="size-4" />
                Situácia
              </div>
              <p className="text-lg leading-8">{step.situation}</p>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold">{step.question}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {step.options.map((option) => {
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
                      <div className="mb-4 flex items-center justify-between">
                        {option.isSafe ? (
                          <CheckCircle2 className="size-5 text-[#0F766E]" />
                        ) : (
                          <AlertTriangle className="size-5 text-[#FF6B6B]" />
                        )}
                        <Badge variant="outline">
                          {option.riskDelta > 0 ? "+" : ""}
                          {option.riskDelta}
                        </Badge>
                      </div>
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
                  feedback.isSafe ? "border-[#0F766E]/30 bg-[#E7F7F3]" : "border-[#FF6B6B]/30 bg-[#FFF0F0]"
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
                Resetovať demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </TiltedCard>
    </div>
  );
}
