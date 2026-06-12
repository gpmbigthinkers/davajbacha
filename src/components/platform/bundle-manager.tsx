"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Loader2,
  MessageCircle,
  Package,
  Plus,
  Save,
  Sparkles,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { csrfHeaders } from "@/lib/csrf-client";

type Scenario = {
  id: number;
  title: string;
  category: string;
  steps: number;
};

type Bundle = {
  id: number;
  name: string;
  className: string;
  active: boolean;
  scenarioIds: number[];
};

type GeneratedMessage = {
  sender: "user" | "other";
  name: string;
  message: string;
  timestamp?: string;
};

type GeneratedOption = {
  id: string;
  label: string;
  feedback: string;
  principle: string;
  riskDelta: number;
  isSafe: boolean;
};

type GeneratedStep = {
  key: string;
  title: string;
  order: number;
  messages: GeneratedMessage[];
  question: string;
  options: GeneratedOption[];
  interactionMode?: "multiple_choice" | "interactive_chat";
  chatConfig?: {
    botName: string;
    maxTurns?: number;
  };
};

type GeneratedScenario = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  accent: string;
  steps: GeneratedStep[];
};

export function BundleManager() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  // AI generation state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiCategories, setAiCategories] = useState<string[]>(["grooming", "phishing"]);
  const [aiCount, setAiCount] = useState(3);
  const [aiTopic, setAiTopic] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<GeneratedScenario[] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSavingId, setAiSavingId] = useState<number | null>(null);
  const [aiGeneratedMode, setAiGeneratedMode] = useState<
    "multiple_choice" | "interactive_chat" | null
  >(null);

  useEffect(() => {
    async function load() {
      try {
        const [bRes, sRes] = await Promise.all([
          fetch("/api/bundle"),
          fetch("/api/scenario"),
        ]);
        if (bRes.ok) {
          const raw = (await bRes.json()) as Array<{
            id: number;
            name: string;
            className: string;
            active: boolean;
          }>;
          // fetch scenarios for each bundle
          const withScenarios = await Promise.all(
            raw.map(async (b) => {
              const scRes = await fetch(`/api/bundle?id=${b.id}`);
              const sc = (await scRes.json()) as Array<{ id: number }>;
              return { ...b, scenarioIds: sc.map((s) => s.id) };
            })
          );
          setBundles(withScenarios);
        }
        if (sRes.ok) {
          const rawS = (await sRes.json()) as Array<{
            id: number;
            title: string;
            category: string;
            steps: Array<unknown>;
          }>;
          setScenarios(
            rawS.map((s) => ({
              id: s.id,
              title: s.title,
              category: s.category,
              steps: s.steps.length,
            }))
          );
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function createBundle() {
    if (!newName.trim() || selectedIds.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/bundle", {
        method: "POST",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name: newName.trim(), scenarioIds: selectedIds }),
      });
      if (res.ok) {
        const created = (await res.json()) as Bundle;
        setBundles((prev) => [
          ...prev,
          { ...created, scenarioIds: selectedIds, className: "" },
        ]);
        setCreating(false);
        setNewName("");
        setSelectedIds([]);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function saveBundle(bundle: Bundle) {
    setSaving(true);
    try {
      await fetch(`/api/bundle?id=${bundle.id}`, {
        method: "PUT",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          name: bundle.name,
          active: bundle.active,
          scenarioIds: bundle.scenarioIds,
        }),
      });
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  function toggleScenario(bundleId: number, scenarioId: number) {
    setBundles((prev) =>
      prev.map((b) =>
        b.id === bundleId
          ? {
              ...b,
              scenarioIds: b.scenarioIds.includes(scenarioId)
                ? b.scenarioIds.filter((id) => id !== scenarioId)
                : [...b.scenarioIds, scenarioId],
            }
          : b
      )
    );
  }

  async function generateScenarios(
    interactionMode: "multiple_choice" | "interactive_chat"
  ) {
    setAiGenerating(true);
    setAiError(null);
    setAiResult(null);
    setAiGeneratedMode(interactionMode);
    try {
      const res = await fetch("/api/ai/generate-bundle", {
        method: "POST",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          categories: aiCategories,
          scenarioCount: aiCount,
          topicHint: aiTopic.trim() || undefined,
          interactionMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Chyba pri generovaní");
        return;
      }
      setAiResult(data.scenarios as GeneratedScenario[]);
    } catch {
      setAiError("Nepodarilo sa spojiť s AI");
    } finally {
      setAiGenerating(false);
    }
  }

  async function saveGeneratedScenario(scenario: GeneratedScenario, index: number) {
    setAiSavingId(index);
    try {
      const res = await fetch("/api/ai/generate-bundle", {
        method: "PUT",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ scenario }),
      });
      if (res.ok) {
        const data = (await res.json()) as { id: number };
        // Add to local scenarios list
        setScenarios((prev) => [
          ...prev,
          {
            id: data.id,
            title: scenario.title,
            category: scenario.category,
            steps: scenario.steps.length,
          },
        ]);
        // Remove from AI results
        setAiResult((prev) => prev?.filter((_, i) => i !== index) ?? null);
      } else {
        const data = await res.json();
        setAiError(data.error || "Nepodarilo sa uložiť");
      }
    } catch {
      setAiError("Nepodarilo sa uložiť scenár");
    } finally {
      setAiSavingId(null);
    }
  }

  const categoryLabels: Record<string, string> = {
    grooming: "Grooming",
    phishing: "Phishing",
    deepfake: "Deepfake",
    kybersikana: "Kyberšikana",
    oversharing: "Oversharing",
  };

  function toggleAiCategory(cat: string) {
    setAiCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  if (loading) {
    return (
      <Card className="rounded-lg">
        <CardContent className="py-8">
          <p className="text-muted-foreground">Načítavam balíky...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="font-heading text-2xl font-bold flex items-center gap-2">
            <Package className="size-5 text-[#EC4899]" />
            Balíky scenárov
          </CardTitle>
          <CardDescription>
            Vytvor balík scenárov a priraď ho k vstupnému kódu. Žiak uvidí iba
            scenáre z tohto balíka.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {!creating ? (
              <Button onClick={() => setCreating(true)}>
                <Plus data-icon="inline-start" />
                Nový balík
              </Button>
            ) : null}

            <Button
              variant="outline"
              onClick={() => {
                setAiOpen(!aiOpen);
                setAiResult(null);
                setAiError(null);
              }}
            >
              <Sparkles data-icon="inline-start" />
              AI Generovať scenáre
            </Button>
          </div>

          {!creating ? null : (
            <div className="rounded-xl border bg-white p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Nový balík</p>
                <button
                  onClick={() => {
                    setCreating(false);
                    setNewName("");
                    setSelectedIds([]);
                  }}
                  className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="space-y-2">
                <Label>Názov balíka</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="napr. Pilot týždeň 1"
                />
              </div>
              <div className="space-y-2">
                <Label>Scenáre v balíku</Label>
                <div className="grid gap-2">
                  {scenarios.map((s) => (
                    <button
                      key={s.id}
                      onClick={() =>
                        setSelectedIds((prev) =>
                          prev.includes(s.id)
                            ? prev.filter((id) => id !== s.id)
                            : [...prev, s.id]
                        )
                      }
                      className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
                        selectedIds.includes(s.id)
                          ? "border-primary bg-primary/5"
                          : "border-border bg-white hover:bg-secondary"
                      }`}
                    >
                      <span>{s.title}</span>
                      {selectedIds.includes(s.id) && (
                        <Check className="size-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={createBundle}
                disabled={saving || !newName.trim() || selectedIds.length === 0}
              >
                <Save data-icon="inline-start" />
                {saving ? "Ukladám..." : "Vytvoriť balík"}
              </Button>
            </div>
          )}

          {/* AI Generation Panel */}
          {aiOpen && (
            <div className="rounded-xl border-2 border-dashed border-[#EC4899]/40 bg-[#FDF2F8] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold flex items-center gap-2">
                  <Sparkles className="size-4 text-[#EC4899]" />
                  AI Generátor scenárov
                </p>
                <button
                  onClick={() => {
                    setAiOpen(false);
                    setAiResult(null);
                    setAiError(null);
                  }}
                  className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Kategórie hrozieb</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => toggleAiCategory(key)}
                        className={`rounded-full px-3 py-1 text-sm transition ${
                          aiCategories.includes(key)
                            ? "bg-[#EC4899] text-white"
                            : "bg-white border text-muted-foreground hover:border-[#EC4899]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Počet scenárov</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAiCount(Math.max(1, aiCount - 1))}
                        disabled={aiCount <= 1}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-bold">{aiCount}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAiCount(Math.min(5, aiCount + 1))}
                        disabled={aiCount >= 5}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Námet (voliteľné)</Label>
                    <Input
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="napr. TikTok výzvy"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    onClick={() => generateScenarios("multiple_choice")}
                    disabled={aiGenerating || aiCategories.length === 0}
                    variant="outline"
                    className="w-full"
                  >
                    {aiGenerating && aiGeneratedMode === "multiple_choice" ? (
                      <>
                        <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                        Generujem A/B...
                      </>
                    ) : (
                      <>
                        <Sparkles data-icon="inline-start" />
                        Generovať A/B scenáre
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => generateScenarios("interactive_chat")}
                    disabled={aiGenerating || aiCategories.length === 0}
                    className="w-full"
                  >
                    {aiGenerating && aiGeneratedMode === "interactive_chat" ? (
                      <>
                        <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                        Generujem chat...
                      </>
                    ) : (
                      <>
                        <MessageCircle data-icon="inline-start" />
                        Generovať interaktívny chat
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Interaktívny chat pripraví kroky tak, že študent píše vlastné
                  odpovede. Referenčné A/B odpovede sa uložia skryte pre AI
                  hodnotenie.
                </p>
              </div>

              {aiError && (
                <div className="rounded-md border border-[#FF6B6B]/30 bg-[#FFF0F0] p-3 text-sm text-[#FF6B6B]">
                  {aiError}
                </div>
              )}

              {aiResult && aiResult.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold">
                    Vygenerované scenáre ({aiResult.length})
                  </p>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {aiResult.map((scenario, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border bg-white p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{scenario.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {categoryLabels[scenario.category] ?? scenario.category}{" "}
                              · {scenario.steps.length} krokov
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline">{scenario.category}</Badge>
                            {scenario.steps.some(
                              (step) => step.interactionMode === "interactive_chat"
                            ) ? (
                              <Badge className="bg-[#EC4899] text-white">
                                Interaktívny chat
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {scenario.summary}
                        </p>

                        {/* Chat preview */}
                        <div className="rounded-md bg-[#E8E8ED] p-3 space-y-2 max-h-[160px] overflow-y-auto">
                          {scenario.steps.slice(0, 1).map((step, si) =>
                            step.messages.slice(0, 3).map((msg, mi) => (
                              <div
                                key={`${si}-${mi}`}
                                className={`flex ${
                                  msg.sender === "user"
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-xl px-3 py-1.5 text-xs ${
                                    msg.sender === "user"
                                      ? "bg-[#EC4899] text-white"
                                      : "bg-white text-foreground"
                                  }`}
                                >
                                  {msg.sender === "other" && (
                                    <p className="text-[10px] font-semibold text-[#EC4899]">
                                      {msg.name}
                                    </p>
                                  )}
                                  <p className="leading-relaxed">{msg.message}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => saveGeneratedScenario(scenario, idx)}
                            disabled={aiSavingId !== null}
                          >
                            {aiSavingId === idx ? (
                              <>
                                <Loader2 className="size-3 animate-spin" data-icon="inline-start" />
                                Ukladám...
                              </>
                            ) : (
                              <>
                                <Save data-icon="inline-start" />
                                Uložiť scenár
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {bundles.map((bundle) => {
            const isOpen = expandedId === bundle.id;
            return (
              <div
                key={bundle.id}
                className="rounded-xl border bg-white overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isOpen ? null : bundle.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen className="size-5 text-[#EC4899]" />
                    <div>
                      <p className="font-semibold">{bundle.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {bundle.scenarioIds.length} scenárov · {bundle.className}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={bundle.active ? "default" : "secondary"}>
                      {bundle.active ? "Aktívny" : "Neaktívny"}
                    </Badge>
                    {isOpen ? (
                      <ChevronUp className="size-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t px-4 py-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <Label>Názov</Label>
                        <Input
                          value={bundle.name}
                          onChange={(e) =>
                            setBundles((prev) =>
                              prev.map((b) =>
                                b.id === bundle.id
                                  ? { ...b, name: e.target.value }
                                  : b
                              )
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Switch
                          checked={bundle.active}
                          onCheckedChange={(checked) =>
                            setBundles((prev) =>
                              prev.map((b) =>
                                b.id === bundle.id
                                  ? { ...b, active: checked }
                                  : b
                              )
                            )
                          }
                        />
                        <Label className="text-sm">Aktívny</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Scenáre v balíku</Label>
                      <div className="grid gap-2">
                        {scenarios.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => toggleScenario(bundle.id, s.id)}
                            className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
                              bundle.scenarioIds.includes(s.id)
                                ? "border-primary bg-primary/5"
                                : "border-border bg-white hover:bg-secondary"
                            }`}
                          >
                            <span>{s.title}</span>
                            {bundle.scenarioIds.includes(s.id) && (
                              <Check className="size-4 text-primary" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => saveBundle(bundle)}
                        disabled={saving}
                      >
                        <Save data-icon="inline-start" />
                        {saving ? "Ukladám..." : "Uložiť zmeny"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
