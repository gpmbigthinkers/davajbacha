import Link from "next/link";
import { ArrowLeft, Tv } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-5 py-20 text-center">
      <div className="mb-6 inline-flex size-20 items-center justify-center rounded-2xl bg-primary/10">
        <Tv className="size-10 text-primary" />
      </div>

      <h1 className="font-heading text-8xl font-bold text-primary">404</h1>

      <p className="mt-4 max-w-md text-2xl font-semibold text-foreground">
        Táto stránka nefunguje, lebo je zima a kúrenie je drahé.
      </p>

      <p className="mt-3 max-w-sm text-muted-foreground">
        Radšej sa zabalila do deky a pozerá telku. Keď bude teplejšie, možno zase vyjde von.
      </p>

      <Link
        href="/"
        className={cn(
          buttonVariants({ size: "lg" }),
          "mt-8 h-11 bg-primary hover:bg-primary/90"
        )}
      >
        <ArrowLeft className="mr-2 size-4" />
        Späť pod perinu
      </Link>
    </main>
  );
}
