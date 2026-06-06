"use client";

import Link from "next/link";
import { BarChart3, Fingerprint, MessageSquareWarning, QrCode } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShinyText } from "@/components/reactbits/shiny-text";
import { cn } from "@/lib/utils";

const paths = [
  {
    href: "/demo/scenar",
    title: "Simulátor scenárov",
    description: "Grooming, phishing, deepfake, kyberšikana a oversharing.",
    icon: MessageSquareWarning,
  },
  {
    href: "/demo/digitalna-stopa",
    title: "Digitálna stopa",
    description: "Profil builder s okamžitým porovnaním rizík.",
    icon: Fingerprint,
  },
  {
    href: "/demo/dashboard",
    title: "Školský dashboard",
    description: "Agregované anonymné indikátory pre triedu.",
    icon: BarChart3,
  },
];

export function DemoHub({ presentationMode = false }: { presentationMode?: boolean }) {
  const suffix = presentationMode ? "?presentation=1" : "";

  return (
    <Tabs defaultValue="ziak" className="gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Badge className="mb-3 bg-primary text-primary-foreground">
            <ShinyText>Demo bez loginu</ShinyText>
          </Badge>
          <h1 className="font-heading text-5xl font-bold text-primary">
            DAVAJ-BACHA app
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-muted-foreground">
            Jeden QR vstup, dve žiacke aktivity a školský výstup pripravený na
            pilotnú prezentáciu.
          </p>
        </div>
        <TabsList>
          <TabsTrigger value="ziak">Žiak</TabsTrigger>
          <TabsTrigger value="skola">Škola</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="ziak" className="grid gap-4 md:grid-cols-2">
        {paths.slice(0, 2).map((item) => (
          <DemoCard key={item.href} item={item} suffix={suffix} />
        ))}
        <Card className="rounded-lg border-[#EC4899]/25 bg-[#FFF4FA] md:col-span-2">
          <CardHeader>
            <QrCode className="mb-4 size-8 text-[#EC4899]" />
            <CardTitle className="font-heading text-3xl font-bold">
              Simulovaný QR vstup
            </CardTitle>
            <CardDescription>
              V produkcii by žiak vstúpil cez triedny QR kód. V deme ide rovno
              do flowu bez registrácie.
            </CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>

      <TabsContent value="skola" className="grid gap-4 md:grid-cols-2">
        <DemoCard item={paths[2]} suffix={suffix} />
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="font-heading text-3xl font-bold">
              Auditovateľný výstup
            </CardTitle>
            <CardDescription>
              Dashboard ukazuje iba agregácie: chybovosť, posun a prioritné
              oblasti. Nie individuálne záznamy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={`/demo/dashboard${suffix}`}
              className={cn(buttonVariants({ size: "lg" }), "h-11")}
            >
              Otvoriť dashboard
            </Link>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function DemoCard({
  item,
  suffix,
}: {
  item: (typeof paths)[number];
  suffix: string;
}) {
  const Icon = item.icon;

  return (
    <Card className="rounded-lg transition hover:-translate-y-1 hover:shadow-lg">
      <CardHeader>
        <Icon className="mb-5 size-8 text-primary" />
        <CardTitle className="font-heading text-3xl font-bold">
          {item.title}
        </CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href={`${item.href}${suffix}`}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11")}
        >
          Spustiť
        </Link>
      </CardContent>
    </Card>
  );
}
