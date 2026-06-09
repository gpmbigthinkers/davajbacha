'use client';

import { ChevronRight, MessageCircle, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LiquidEther from "@/components/reactbits/liquid-ether";

const chatMessages = [
  {
    sender: "other" as const,
    name: "PixelKing_17",
    message: "Hej, dobré si hral ten match. Chceš sa pridať do nášho teamu?",
  },
  {
    sender: "user" as const,
    message: "Jasne, dík za invite",
  },
  {
    sender: "other" as const,
    name: "PixelKing_17",
    message: "Máš dobrý aim, koľko máš rokov?",
  },
];

export function HeroScene() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#180A35] text-white">
      <div className="absolute inset-0">
        <LiquidEther
          colors={["#5227FF", "#FF9FFC", "#B497CF"]}
          mouseForce={18}
          cursorSize={90}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.45}
          autoIntensity={2.0}
          takeoverDuration={0.25}
          autoResumeDelay={2500}
          autoRampDuration={0.6}
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(24,10,53,0)_0%,rgba(24,10,53,0.55)_85%)]" />
      <div className="group pointer-events-auto absolute right-6 top-36 z-20 hidden aspect-[390/844] w-[16.5rem] transition-transform duration-500 ease-out hover:-translate-y-3 lg:block xl:right-[calc((100vw-80rem)/2+2rem)] xl:w-[17.5rem]">
        <div className="relative flex h-full rounded-[2rem] border border-white/15 bg-[linear-gradient(160deg,_rgba(76,29,149,0.7),_rgba(15,8,40,0.92))] p-2.5 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.55),0_15px_30px_-15px_rgba(124,58,237,0.35)] transition-shadow duration-500 ease-out group-hover:shadow-[0_45px_90px_-15px_rgba(0,0,0,0.7),0_25px_50px_-20px_rgba(236,72,153,0.45)]">
          <span className="absolute left-1/2 top-1.5 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/30" />
          <div className="flex h-full flex-1 flex-col justify-between gap-3 overflow-hidden rounded-[1.5rem] bg-white px-4 pb-4 pt-6 text-foreground">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge className="bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                Grooming
              </Badge>
              <Badge
                variant="outline"
                className="px-2.5 py-0.5 text-[10px] font-semibold"
              >
                Krok 1 / 2
              </Badge>
            </div>

            <h3 className="font-heading text-xl font-bold leading-tight">
              Prvé stretnutie na serveri
            </h3>

            <div className="rounded-lg border bg-[#E8E8ED] p-3">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                <MessageCircle className="size-3.5" />
                Chat
              </div>
              <div className="space-y-2">
                {chatMessages.map((msg, i) =>
                  msg.sender === "other" ? (
                    <div key={i} className="flex items-end gap-1.5">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#EC4899] text-white">
                        <User className="size-3" />
                      </div>
                      <div className="rounded-2xl rounded-bl-md bg-white px-2.5 py-1.5 text-[11px] leading-snug text-foreground shadow-sm">
                        <p className="mb-0.5 text-[10px] font-semibold text-[#EC4899]">
                          {msg.name}
                        </p>
                        <p>{msg.message}</p>
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="flex items-end justify-end gap-1.5">
                      <div className="rounded-2xl rounded-br-md bg-[#EC4899] px-2.5 py-1.5 text-[11px] leading-snug text-white">
                        <p>{msg.message}</p>
                      </div>
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                        <User className="size-3" />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-heading text-sm font-bold">Čo urobíš?</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="min-h-14 rounded-md border border-[#FF6B6B]/60 bg-[#FFF0F0] p-2.5 text-[11px] font-semibold leading-snug">
                  Pýtať sa na link do privátneho kanála
                </div>
                <div className="min-h-14 rounded-md border border-[#0F766E]/60 bg-[#E7F7F3] p-2.5 text-[11px] font-semibold leading-snug">
                  Povedat, že zatiaľ ostávam na hlavnom serveri
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                tabIndex={-1}
                className="h-9 flex-1 rounded-md bg-primary text-xs font-semibold"
              >
                Ďalší krok
                <ChevronRight data-icon="inline-end" />
              </Button>
              <Button
                type="button"
                tabIndex={-1}
                variant="outline"
                className="h-9 flex-1 rounded-md text-xs font-semibold"
              >
                Resetovať
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
