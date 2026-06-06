import { Navbar } from "@/components/platform/navbar";
import { ActivityEntryGate } from "@/components/platform/activity-entry-gate";
import { ScenarioTrainer } from "@/components/platform/scenario-trainer";

type ScenarioPageProps = {
  searchParams: Promise<{ presentation?: string; code?: string }>;
};

export default async function ScenarioPage({ searchParams }: ScenarioPageProps) {
  const params = await searchParams;

  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-7xl px-5 py-10">
      <ActivityEntryGate
        activityLabel="Simulátor scenárov"
        description="Bez neho sa scenáre nespustia."
        entryCode={params.code}
        presentationMode={params.presentation === "1"}
        targetPath="/scenar"
      >
        <ScenarioTrainer presentationMode={params.presentation === "1"} />
      </ActivityEntryGate>
    </section>
    </>
  );
}
