'use client';

import { Smartphone, Sparkles } from "lucide-react";

import LiquidEther from "@/components/reactbits/liquid-ether";

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
      <div className="group pointer-events-auto absolute bottom-12 right-[14%] z-20 hidden h-[34rem] w-[19rem] rotate-[-8deg] transition-transform duration-500 ease-out hover:-translate-y-3 hover:rotate-[-4deg] lg:block xl:h-[38rem] xl:w-[21rem] xl:right-[16%]">
        <div className="h-full w-full rounded-[1.8rem] border border-white/20 bg-[#0C0718] p-3 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.55),0_15px_30px_-15px_rgba(124,58,237,0.35)] transition-shadow duration-500 ease-out group-hover:shadow-[0_45px_90px_-15px_rgba(0,0,0,0.7),0_25px_50px_-20px_rgba(236,72,153,0.45)]">
          <div className="h-full w-full rounded-[1.4rem] bg-[#F5F3FF] p-5 text-[#171127]">
            <div className="mb-5 flex items-center justify-between">
              <Smartphone className="size-6 text-primary" />
              <Sparkles className="size-5 text-[#EC4899]" />
            </div>
            <p className="font-heading text-4xl font-bold">Bacha.</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Nácvik reakcie skôr, než príde skutočný incident.
            </p>
            <div className="mt-8 space-y-3">
              <div className="rounded-md bg-primary px-4 py-3 text-sm text-white">
                Overiť identitu
              </div>
              <div className="rounded-md bg-white px-4 py-3 text-sm text-primary shadow-sm">
                Neposielať fotku
              </div>
              <div className="rounded-md bg-[#FFE8EF] px-4 py-3 text-sm text-[#7F123D]">
                Zapojiť dospelého
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
