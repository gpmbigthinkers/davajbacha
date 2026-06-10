import { redirect } from "next/navigation";

import { BundleManager } from "@/components/platform/bundle-manager";
import { DashboardView } from "@/components/platform/dashboard-view";
import { EntryCodeGenerator } from "@/components/platform/entry-code-generator";
import { LogoutButton } from "@/components/platform/logout-button";
import { ScenarioManager } from "@/components/platform/scenario-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSessionUser } from "@/lib/auth";
import {
  getDashboardContext,
  getDashboardOverview,
} from "@/lib/platform-repository";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const [overview, context] = await Promise.all([
    getDashboardOverview(),
    getDashboardContext(),
  ]);

  const updated = new Date(overview.updatedAt);
  const updatedLabel = Number.isNaN(updated.getTime())
    ? null
    : updated.toLocaleDateString("sk-SK", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  return (
    <>
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
            <span className="font-semibold text-foreground/80">
              DAVAJ-BACHA
            </span>
            <span className="text-foreground/20">/</span>
            <span className="font-medium text-foreground">Dashboard</span>
            <span>{context.schoolName}</span>
            <span>{context.className}</span>
            <span className="inline-flex items-center gap-1.5 text-foreground/70">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Anonymizované
            </span>
          </div>
          <LogoutButton />
        </div>
      </header>

      <section className="mx-auto max-w-7xl space-y-10 px-5 py-10">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Školský dashboard
          </p>
          <h1 className="font-heading text-4xl font-bold text-foreground md:text-5xl">
            Prehľad digitálnej odolnosti
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Anonymná agregácia odpovedí žiakov z pilotného overovania. Dáta
            neobsahujú individuálne záznamy a sú vhodné na zdieľanie so
            zriaďovateľom a metodikom prevencie.
          </p>
          {updatedLabel ? (
            <p className="text-xs text-muted-foreground">
              Aktualizované {updatedLabel} · vzorka {overview.sampleSize}{" "}
              anonymných session · cieľová redukcia −
              {overview.targetReduction}%
            </p>
          ) : null}
        </header>

        <Tabs defaultValue="dashboard">
          <TabsList variant="line" className="border-b border-border/60">
            <TabsTrigger value="dashboard">Prehľad</TabsTrigger>
            <TabsTrigger value="scenare">Scenáre</TabsTrigger>
            <TabsTrigger value="baliky">Balíky</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="pt-8">
            <DashboardView initialOverview={overview} />
          </TabsContent>
          <TabsContent value="scenare" className="pt-8">
            <ScenarioManager />
          </TabsContent>
          <TabsContent value="baliky" className="pt-8">
            <BundleManager />
          </TabsContent>
        </Tabs>

        <section className="space-y-4 border-t border-border/60 pt-10">
          <header className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Administrácia
            </p>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              Vstupné kódy pre žiakov
            </h2>
            <p className="text-sm text-muted-foreground">
              Vygeneruj QR kód alebo krátky vstupný kód priradený k zvolenému
              balíku scenárov.
            </p>
          </header>
          <EntryCodeGenerator />
        </section>
      </section>
    </>
  );
}
