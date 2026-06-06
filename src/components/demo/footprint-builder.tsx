"use client";

import { useState, useTransition } from "react";
import { Eye, LockKeyhole, Save, ShieldCheck } from "lucide-react";

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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useDemoSession } from "@/hooks/use-demo-session";
import { footprintSignals } from "@/lib/demo-data";
import { calculateFootprintRisk } from "@/lib/scoring";
import type { FootprintRiskSummary } from "@/lib/demo-types";

export function FootprintBuilder({
  presentationMode = false,
}: {
  presentationMode?: boolean;
}) {
  const sessionToken = useDemoSession(presentationMode);
  const [publicName, setPublicName] = useState("davaj_bacha_student");
  const [selectedSignals, setSelectedSignals] = useState<string[]>(
    presentationMode ? ["school", "route", "contact"] : ["school", "route"]
  );
  const [summary, setSummary] = useState<FootprintRiskSummary>(() =>
    calculateFootprintRisk({ publicName, selectedSignals })
  );
  const [isPending, startTransition] = useTransition();

  function toggleSignal(signalId: string, checked: boolean) {
    const next = checked
      ? [...selectedSignals, signalId]
      : selectedSignals.filter((item) => item !== signalId);

    setSelectedSignals(next);
    setSummary(calculateFootprintRisk({ publicName, selectedSignals: next }));
  }

  function saveProfile() {
    startTransition(async () => {
      const localSummary = calculateFootprintRisk({ publicName, selectedSignals });
      setSummary(localSummary);

      if (!sessionToken) {
        return;
      }

      try {
        const response = await fetch("/api/demo/footprint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionToken,
            publicName,
            selectedSignals,
          }),
        });
        const data = (await response.json()) as FootprintRiskSummary;
        setSummary(data);
      } catch {
        setSummary(localSummary);
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="rounded-lg">
        <CardHeader>
          <Badge className="mb-2 w-fit bg-[#0F766E] text-white">
            Modul 2
          </Badge>
          <CardTitle className="font-heading text-3xl font-bold">
            Digitálna stopa
          </CardTitle>
          <CardDescription>
            Žiaci vidia, čo sa dá odvodiť z bežného verejného profilu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="publicName">Verejný handle</Label>
            <Input
              id="publicName"
              value={publicName}
              onChange={(event) => {
                setPublicName(event.target.value);
                setSummary(
                  calculateFootprintRisk({
                    publicName: event.target.value,
                    selectedSignals,
                  })
                );
              }}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            {footprintSignals.map((signal) => (
              <div
                key={signal.id}
                className="flex items-start justify-between gap-3 rounded-lg border bg-white p-3"
              >
                <div>
                  <Label className="text-sm font-semibold">{signal.label}</Label>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Rizikový signál +{signal.risk}
                  </p>
                </div>
                <Switch
                  checked={selectedSignals.includes(signal.id)}
                  onCheckedChange={(checked) => toggleSignal(signal.id, checked)}
                />
              </div>
            ))}
          </div>

          <Button className="w-full" disabled={isPending} onClick={saveProfile}>
            <Save data-icon="inline-start" />
            Uložiť anonymný profil
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-lg border-[#FF6B6B]/35 bg-[#FFF7F7]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="font-heading text-3xl font-bold">
                Rizikový profil
              </CardTitle>
              <Eye className="size-6 text-[#FF6B6B]" />
            </div>
            <CardDescription>
              Verejné signály poskladané do čitateľného vzorca.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Rizikové skóre</span>
                <span className="font-heading text-3xl font-bold text-[#B42318]">
                  {summary.riskScore}%
                </span>
              </div>
              <Progress
                value={summary.riskScore}
                className="mt-3 [&_[data-slot=progress-indicator]]:bg-[#FF6B6B]"
              />
            </div>
            <div className="space-y-2">
              {summary.derivedRisks.length > 0 ? (
                summary.derivedRisks.map((risk) => (
                  <div key={risk} className="rounded-md bg-white px-3 py-2 text-sm">
                    {risk}
                  </div>
                ))
              ) : (
                <div className="rounded-md bg-white px-3 py-2 text-sm">
                  Profil zatiaľ neposkytuje silný verejný vzorec.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-[#0F766E]/35 bg-[#E7F7F3]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="font-heading text-3xl font-bold">
                Bezpečnejší profil
              </CardTitle>
              <LockKeyhole className="size-6 text-[#0F766E]" />
            </div>
            <CardDescription>
              Rovnaký online život, menej presných verejných signálov.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg bg-white p-4">
              <div className="flex items-center gap-2 text-[#0F766E]">
                <ShieldCheck className="size-5" />
                <span className="text-sm font-semibold">
                  Úroveň: {summary.level}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Cieľ nie je prestať zdieľať, ale znížiť presnosť a časovú
                čitateľnosť verejného profilu.
              </p>
            </div>
            <div className="space-y-2">
              {summary.safeProfile.length > 0 ? (
                summary.safeProfile.map((item) => (
                  <div key={item} className="rounded-md bg-white px-3 py-2 text-sm">
                    {item}
                  </div>
                ))
              ) : (
                <div className="rounded-md bg-white px-3 py-2 text-sm">
                  Neuvádzasz presné verejné signály.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
