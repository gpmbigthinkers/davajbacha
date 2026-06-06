"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Navbar } from "@/components/platform/navbar";

export default function VstupPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryCode: code.trim().toUpperCase() }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setError(err.error || "Neplatný alebo neaktívny kód.");
        setLoading(false);
        return;
      }

      router.push(`/scenar?code=${encodeURIComponent(code.trim().toUpperCase())}`);
    } catch {
      setError("Nepodarilo sa pripojiť.");
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-3xl font-bold">
            DAVAJ-BACHA
          </CardTitle>
          <CardDescription>
            Zadaj vstupný kód od učiteľa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Vstupný kód</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={8}
                required
              />
            </div>
            {error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : null}
            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn data-icon="inline-start" />
              {loading ? "Pripájam..." : "Začať scenár"}
              <ArrowRight data-icon="inline-end" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
    </>
  );
}
