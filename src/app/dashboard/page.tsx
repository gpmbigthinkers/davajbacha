import { Navbar } from "@/components/platform/navbar";

import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BundleManager } from "@/components/platform/bundle-manager";
import { DashboardView } from "@/components/platform/dashboard-view";
import { EntryCodeGenerator } from "@/components/platform/entry-code-generator";
import { LogoutButton } from "@/components/platform/logout-button";
import { ScenarioManager } from "@/components/platform/scenario-manager";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/scenar"
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          <ArrowLeft data-icon="inline-start" />
          Späť na scenáre
        </Link>
        <LogoutButton />
      </div>

      <EntryCodeGenerator />

      <Tabs defaultValue="dashboard" className="mt-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="scenare">Scenáre</TabsTrigger>
          <TabsTrigger value="baliky">Balíky</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-4">
          <DashboardView />
        </TabsContent>
        <TabsContent value="scenare" className="mt-4">
          <ScenarioManager />
        </TabsContent>
        <TabsContent value="baliky" className="mt-4">
          <BundleManager />
        </TabsContent>
      </Tabs>
    </section>
    </>
  );
}
