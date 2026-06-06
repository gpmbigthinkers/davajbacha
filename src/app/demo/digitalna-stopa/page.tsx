import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { FootprintBuilder } from "@/components/demo/footprint-builder";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FootprintPageProps = {
  searchParams: Promise<{ presentation?: string }>;
};

export default async function FootprintPage({ searchParams }: FootprintPageProps) {
  const params = await searchParams;

  return (
    <section className="mx-auto max-w-7xl px-5 py-10">
      <Link
        href={`/demo${params.presentation === "1" ? "?presentation=1" : ""}`}
        className={cn(buttonVariants({ variant: "ghost" }), "mb-6")}
      >
        <ArrowLeft data-icon="inline-start" />
        Späť na demo
      </Link>
      <FootprintBuilder presentationMode={params.presentation === "1"} />
    </section>
  );
}
