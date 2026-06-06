"use client";

import { Navbar } from "@/components/platform/navbar";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error || "Prihlásenie zlyhalo");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Nepodarilo sa pripojiť k serveru");
    } finally {
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
            Prihlásenie pre školský dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : null}
            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn data-icon="inline-start" />
              {loading ? "Prihlasujem..." : "Prihlásiť sa"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
    </>
  );
}
