"use client";

import { useState } from "react";
import {
  Eye,
  Lightbulb,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { submitFootprintVerification } from "@/lib/footprint-client";
import {
  createEmptyFootprintAnswers,
  footprintQuestions,
  hasMeaningfulFootprintAnswers,
} from "@/lib/footprint-verification";
import type {
  FootprintVerificationAnswers,
  FootprintVerificationResult,
} from "@/lib/platform-types";

const levelCopy: Record<FootprintVerificationResult["safetyLevel"], string> = {
  nizka: "Nízka bezpečnosť",
  stredna: "Stredná bezpečnosť",
  vysoka: "Vysoká bezpečnosť",
};

const levelClasses: Record<FootprintVerificationResult["safetyLevel"], string> = {
  nizka: "text-[#B42318]",
  stredna: "text-[#B54708]",
  vysoka: "text-[#0F766E]",
};

const progressClasses: Record<
  FootprintVerificationResult["safetyLevel"],
  string
> = {
  nizka: "[&_[data-slot=progress-indicator]]:bg-[#FF6B6B]",
  stredna: "[&_[data-slot=progress-indicator]]:bg-[#F59E0B]",
  vysoka: "[&_[data-slot=progress-indicator]]:bg-[#0F766E]",
};

export function FootprintBuilder() {
  const [answers, setAnswers] = useState<FootprintVerificationAnswers>(() =>
    createEmptyFootprintAnswers()
  );
  const [result, setResult] = useState<FootprintVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  function updateAnswer(id: keyof FootprintVerificationAnswers, value: string) {
    setAnswers((current) => ({
      ...current,
      [id]: value,
    }));
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasMeaningfulFootprintAnswers(answers)) {
      setError("Napíš aspoň jednu odpoveď, aby sa profil dal overiť.");
      setResult(null);
      return;
    }

    setIsVerifying(true);
    setError(null);
    setResult(null);

    try {
      const nextResult = await submitFootprintVerification(answers);
      setResult(nextResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Profil sa nepodarilo overiť. Skús to znova."
      );
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
      <Card className="rounded-lg border-[#0F766E]/15 bg-white/95 shadow-sm">
        <CardHeader>
          <Badge className="mb-2 w-fit bg-[#0F766E] text-white">Modul 2</Badge>
          <CardTitle className="font-heading text-3xl font-bold">
            Digitálna stopa
          </CardTitle>
          <CardDescription>
            Odpovedz vlastnými slovami, čo máš verejne viditeľné na profile. AI
            potom odhadne, ako ľahko sa z toho dá čítať tvoj režim a identita.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {footprintQuestions.map((question) => (
              <div key={question.id} className="space-y-2">
                <Label className="text-sm font-semibold" htmlFor={question.id}>
                  {question.label}
                </Label>
                <p className="text-xs leading-5 text-muted-foreground">
                  {question.description}
                </p>
                <Textarea
                  id={question.id}
                  rows={4}
                  className="resize-none bg-white"
                  placeholder={question.placeholder}
                  value={answers[question.id]}
                  onChange={(event) => updateAnswer(question.id, event.target.value)}
                />
              </div>
            ))}

            {error ? (
              <Alert className="border-[#FF6B6B]/25 bg-[#FFF1F1] text-[#B42318]">
                <AlertTitle>Profil sa nepodarilo overiť</AlertTitle>
                <AlertDescription className="text-[#B42318]/85">
                  {error}
                </AlertDescription>
              </Alert>
            ) : null}

            <Button
              className="w-full bg-[#0F766E] hover:bg-[#0B5E58]"
              disabled={isVerifying}
              type="submit"
            >
              {isVerifying ? (
                <LoaderCircle className="animate-spin" data-icon="inline-start" />
              ) : (
                <Sparkles data-icon="inline-start" />
              )}
              {isVerifying ? "Overujem profil..." : "Overiť profil"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="rounded-lg border-[#0F766E]/20 bg-[linear-gradient(135deg,#F3FBF8_0%,#FFFFFF_55%,#F8F5FF_100%)] shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="font-heading text-3xl font-bold">
                  Overenie AI
                </CardTitle>
                <CardDescription>
                  Bez bodovania podľa checkboxov. Profil sa číta z tvojich
                  vlastných odpovedí.
                </CardDescription>
              </div>
              <ShieldCheck className="size-7 text-[#0F766E]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {result ? (
              <>
                <div className="rounded-2xl border border-[#0F766E]/10 bg-white/90 p-5">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#0F766E]">
                        {levelCopy[result.safetyLevel]}
                      </p>
                      <h3 className="mt-1 font-heading text-2xl font-bold">
                        {result.profileLabel}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                        Safety score
                      </p>
                      <p
                        className={`font-heading text-4xl font-bold ${levelClasses[result.safetyLevel]}`}
                      >
                        {result.safetyScore}%
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={result.safetyScore}
                    className={`mt-4 ${progressClasses[result.safetyLevel]}`}
                  />
                </div>

                <div className="rounded-2xl border border-[#E9D7FE] bg-white/90 p-5">
                  <div className="flex items-center gap-2 text-[#6D28D9]">
                    <Lightbulb className="size-5" />
                    <span className="text-sm font-semibold">
                     5 odporúčaní od AI aj s vysvetlením
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {result.advice.map((item, index) => (
                      <div
                        key={`${item.title}-${index}`}
                        className="rounded-2xl border border-[#E9D7FE] bg-[#F7F3FF] px-4 py-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#6D28D9]">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {item.title}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              {item.why}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#0F766E]/25 bg-white/75 p-6 text-sm leading-6 text-muted-foreground">
                Vyplň odpovede a klikni na{" "}
                <span className="font-semibold text-foreground">Overiť profil</span>.
                Zobrazí sa celková bezpečnosť, rizikový profil a bezpečnejšia verzia
                toho istého online správania.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-lg border-[#FF6B6B]/35 bg-[#FFF7F7] shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="font-heading text-3xl font-bold">
                  Rizikový profil
                </CardTitle>
                <Eye className="size-6 text-[#FF6B6B]" />
              </div>
              <CardDescription>
                Čo si vie cudzí človek vyskladať z tvojich verejných odpovedí.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {result ? (
                <>
                  <div className="rounded-lg bg-white p-4 text-sm leading-6">
                    {result.riskyProfile.summary}
                  </div>
                  <div className="space-y-2">
                    {result.riskyProfile.signals.map((signal) => (
                      <div key={signal} className="rounded-md bg-white px-3 py-2 text-sm">
                        {signal}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-md bg-white px-3 py-2 text-sm">
                  Zatiaľ tu nie je analýza rizikových signálov.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg border-[#0F766E]/35 bg-[#E7F7F3] shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="font-heading text-3xl font-bold">
                  Bezpečnejší profil
                </CardTitle>
                <LockKeyhole className="size-6 text-[#0F766E]" />
              </div>
              <CardDescription>
                Ako môže vyzerať podobný profil s menšou čitateľnosťou pre cudzích ľudí.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {result ? (
                <>
                  <div className="rounded-lg bg-white p-4 text-sm leading-6">
                    {result.saferProfile.summary}
                  </div>
                  <div className="space-y-2">
                    {result.saferProfile.replacements.map((item) => (
                      <div key={item} className="rounded-md bg-white px-3 py-2 text-sm">
                        {item}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-md bg-white px-3 py-2 text-sm">
                  Po overení sa tu zobrazí bezpečnejšia verzia rovnakého profilu.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
