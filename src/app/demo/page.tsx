import { DemoHub } from "@/components/demo/demo-hub";

type DemoPageProps = {
  searchParams: Promise<{ presentation?: string }>;
};

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const params = await searchParams;

  return (
    <section className="mx-auto max-w-7xl px-5 py-12">
      <DemoHub presentationMode={params.presentation === "1"} />
    </section>
  );
}
