import { Suspense } from "react";

import { FloatingDock } from "@/components/reactbits/floating-dock";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen pb-28">
      {children}
      <Suspense fallback={null}>
        <FloatingDock />
      </Suspense>
    </main>
  );
}
