import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";

import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin-ext"],
});

const headingFont = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin-ext"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "DAVAJ-BACHA | Digitálna odolnosť žiakov",
  description:
    "Demo web diagnostickej a vzdelávacej platformy pre nácvik bezpečných reakcií na online hrozby.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sk"
      className={`${bodyFont.variable} ${headingFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
