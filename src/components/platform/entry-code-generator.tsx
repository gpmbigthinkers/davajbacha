"use client";

import { useEffect, useState } from "react";
import { QrCode, RefreshCw, Copy, Check, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type EntryCode = {
  id: number;
  code: string;
  qrToken: string;
  className: string;
  bundleId: number | null;
  createdAt: string;
};

type Bundle = {
  id: number;
  name: string;
};

export function EntryCodeGenerator() {
  const [codes, setCodes] = useState<EntryCode[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [selectedBundleId, setSelectedBundleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [cRes, bRes] = await Promise.all([
          fetch("/api/entry-code"),
          fetch("/api/bundle"),
        ]);
        if (cRes.ok && active) {
          const data = (await cRes.json()) as EntryCode[];
          setCodes(data);
        }
        if (bRes.ok && active) {
          const data = (await bRes.json()) as Bundle[];
          setBundles(data);
          setSelectedBundleId((current) => current ?? data[0]?.id ?? null);
        }
      } catch {
        // ignore
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/entry-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundleId: selectedBundleId ?? undefined,
        }),
      });
      if (res.ok) {
        const code = (await res.json()) as EntryCode;
        setCodes((prev) => [...prev, code]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function copyUrl(code: string, id: number) {
    const url = `${window.location.origin}/scenar?code=${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  async function removeCode(id: number, code: string) {
    const confirmed = window.confirm(`Zmazať vstupný kód ${code}?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch("/api/entry-code", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setCodes((prev) => prev.filter((item) => item.id !== id));
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-lg border-[#EC4899]/20">
        <CardHeader>
          <CardTitle className="font-heading text-2xl font-bold flex items-center gap-2">
            <QrCode className="size-5 text-[#EC4899]" />
            Vstupné kódy
          </CardTitle>
          <CardDescription>
            Vygeneruj QR kód alebo vstupný kód priradený k balíku scenárov.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label>Balík scenárov</Label>
              <select
                className="flex h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={selectedBundleId ?? ""}
                onChange={(e) => setSelectedBundleId(Number(e.target.value))}
              >
                {bundles.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={generate} disabled={loading}>
              <RefreshCw data-icon="inline-start" className={loading ? "animate-spin" : ""} />
              {loading ? "Generujem..." : "Generovať nový kód"}
            </Button>
          </div>

          {codes.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {codes.map((code) => {
                const url = `${window.location.origin}/scenar?code=${code.code}`;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
                const bundle = bundles.find((b) => b.id === code.bundleId);

                return (
                  <div
                    key={code.id}
                    className="rounded-xl border bg-white p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-3xl font-bold text-primary">
                        {code.code}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyUrl(code.code, code.id)}
                          aria-label={`Kopírovať odkaz pre kód ${code.code}`}
                        >
                          {copiedId === code.id ? (
                            <Check className="size-4 text-green-600" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCode(code.id, code.code)}
                          disabled={deletingId === code.id}
                          aria-label={`Zmazať kód ${code.code}`}
                        >
                          <Trash2 className="size-4 text-[#FF6B6B]" />
                        </Button>
                      </div>
                    </div>
                    <img
                      src={qrUrl}
                      alt="QR kód"
                      className="mx-auto rounded-lg"
                      width={180}
                      height={180}
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      {code.className}
                      {bundle && ` · ${bundle.name}`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
