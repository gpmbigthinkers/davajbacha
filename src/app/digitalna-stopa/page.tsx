import { Navbar } from "@/components/platform/navbar";
import { ActivityEntryGate } from "@/components/platform/activity-entry-gate";
import { FootprintBuilder } from "@/components/platform/footprint-builder";

type FootprintPageProps = {
  searchParams: Promise<{ presentation?: string; code?: string }>;
};

export default async function FootprintPage({ searchParams }: FootprintPageProps) {
  const params = await searchParams;

  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-7xl px-5 py-10">
      <ActivityEntryGate
        activityLabel="Digitálna stopa"
        description="Bez neho sa profilový test nespustí."
        entryCode={params.code}
        presentationMode={params.presentation === "1"}
        targetPath="/digitalna-stopa"
      >
        <FootprintBuilder />
      </ActivityEntryGate>
    </section>
    </>
  );
}
