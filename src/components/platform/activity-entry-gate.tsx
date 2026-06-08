"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, LoaderCircle, QrCode } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ActivityEntryGateProps = {
  activityLabel: string;
  description: string;
  entryCode?: string;
  presentationMode?: boolean;
  targetPath: string;
  children: React.ReactNode;
};

type GateState = "checking" | "prompt" | "ready";

export function ActivityEntryGate({
  activityLabel,
  description,
  entryCode,
  presentationMode = false,
  targetPath,
  children,
}: ActivityEntryGateProps) {
  const router = useRouter();
  const [code, setCode] = useState(entryCode ?? "");
  const [error, setError] = useState("");
  const [gateState, setGateState] = useState<GateState>(entryCode ? "checking" : "prompt");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function validateExistingCode() {
      if (!entryCode) {
        setGateState("prompt");
        return;
      }

      try {
        const response = await fetch(
          `/api/entry-code?code=${encodeURIComponent(entryCode)}`,
          { cache: "no-store" }
        );

        if (!active) {
          return;
        }

        if (response.ok) {
          setGateState("ready");
          setError("");
          return;
        }

        setGateState("prompt");
        setError("Tento vstupný kód nie je platný alebo už nie je aktívny.");
      } catch {
        if (!active) {
          return;
        }

        setGateState("prompt");
        setError("Nepodarilo sa overiť vstupný kód.");
      }
    }

    validateExistingCode();

    return () => {
      active = false;
    };
  }, [entryCode]);

  async function submitCode() {
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
      setError("Najprv zadaj vstupný kód.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/entry-code?code=${encodeURIComponent(normalizedCode)}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        setError("Tento vstupný kód nie je platný alebo už nie je aktívny.");
        setSubmitting(false);
        return;
      }

      const suffix = presentationMode ? "&presentation=1" : "";
      router.replace(`${targetPath}?code=${encodeURIComponent(normalizedCode)}${suffix}`);
    } catch {
      setError("Nepodarilo sa overiť vstupný kód.");
      setSubmitting(false);
    }
  }

  if (gateState === "ready") {
    return <>{children}</>;
  }

  if (gateState === "checking") {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border bg-white px-5 py-4 text-sm text-muted-foreground shadow-sm">
          <LoaderCircle className="size-5 animate-spin text-primary" />
          Overujem vstupný kód...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="rounded-lg border-primary/15 bg-white/95 shadow-[0_24px_80px_rgba(76,29,149,0.16)]">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">
              {activityLabel}
            </Badge>
            <Badge variant="outline">Vstupný kód</Badge>
          </div>
          <div>
            <CardTitle className="font-heading text-4xl font-bold">
              Najprv vstupný kód
            </CardTitle>
            <CardDescription className="mt-3 text-base leading-7">
              Pre pokračovanie potrebuješ školský vstupný kód od učiteľa.
              {" "}
              {description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border bg-secondary/60 p-5">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <KeyRound className="size-4" />
                Vstupný kód
              </div>
              <Input
                id={`gate-code-${targetPath}`}
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={8}
                autoFocus
                className="h-14 rounded-lg border-border bg-white px-4 text-center font-mono text-xl font-semibold tracking-[0.18em]"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void submitCode();
                  }
                }}
              />
            </div>

            {error ? (
              <Alert className="border-[#FF6B6B]/25 bg-[#FFF1F1] text-[#B42318]">
                <AlertTitle>Kód sa nepodarilo overiť</AlertTitle>
                <AlertDescription className="text-[#B42318]/85">
                  {error}
                </AlertDescription>
              </Alert>
            ) : null}

            <Button
              className="mt-4 h-12 w-full rounded-lg text-base"
              disabled={submitting}
              onClick={() => void submitCode()}
            >
              {submitting ? (
                <LoaderCircle data-icon="inline-start" className="animate-spin" />
              ) : (
                <ArrowRight data-icon="inline-start" />
              )}
              Pokračovať do aktivity
            </Button>
          </div>

          <div className="rounded-lg border border-[#EC4899]/20 bg-[#FFF4FA] p-4">
            <div className="flex items-start gap-3">
              <QrCode className="mt-0.5 size-5 text-[#EC4899]" />
              <p className="text-sm leading-6 text-muted-foreground">
                Kód môžeš odpísať z tabule alebo sa pripojiť cez QR vstup od
                učiteľa.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
