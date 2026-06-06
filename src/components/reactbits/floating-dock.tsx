"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Fingerprint, MessageSquareWarning } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const items = [
  { href: "/scenar", label: "Simulátor", icon: MessageSquareWarning },
  { href: "/digitalna-stopa", label: "Digitálna stopa", icon: Fingerprint },
];

export function FloatingDock() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const presentation = searchParams.get("presentation") === "1";
  const suffix = presentation ? "?presentation=1" : "";

  return (
    <nav className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-lg border border-white/50 bg-white/90 p-2 shadow-[0_18px_60px_rgba(76,29,149,0.18)] backdrop-blur">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger
                render={
                  <Link
                    href={`${item.href}${suffix}`}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-primary",
                      active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    )}
                    aria-label={item.label}
                  />
                }
              >
                <Icon className="size-5" />
              </TooltipTrigger>
              <TooltipContent>{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </nav>
  );
}
