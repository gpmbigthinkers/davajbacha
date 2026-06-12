"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  FileText,
  MessageCircle,
  MessageSquare,
  Plus,
  Save,
  ShieldAlert,
  Trash2,
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
import { Textarea } from "@/components/ui/textarea";
import { csrfHeaders } from "@/lib/csrf-client";
import { threatLabels } from "@/lib/platform-data";

type ScenarioOption = {
  id: string;
  label: string;
  feedback: string;
  principle: string;
  riskDelta: number;
  isSafe: boolean;
};

type ChatMessage = {
  sender: "user" | "other";
  name: string;
  message: string;
  timestamp?: string;
};

type ScenarioStep = {
  id: number;
  key: string;
  title: string;
  situation: string;
  question: string;
  options: ScenarioOption[];
  messages?: ChatMessage[] | null;
  interactionMode?: "multiple_choice" | "interactive_chat";
  chatConfig?: {
    botName: string;
    maxTurns?: number;
  };
};

type Scenario = {
  id: number;
  slug: string;
  title: string;
  category: string;
  summary: string;
  accent: string;
  steps: ScenarioStep[];
};

function buildStepSavePayload(step: ScenarioStep) {
  const interactionMode = step.interactionMode ?? "multiple_choice";
  const lastOtherName = [...(step.messages ?? [])]
    .reverse()
    .find((message) => message.sender === "other")
    ?.name?.trim();

  return {
    title: step.title,
    situation: step.situation,
    question: step.question,
    options: step.options,
    messages: step.messages ?? null,
    interactionMode,
    chatConfig:
      interactionMode === "interactive_chat"
        ? {
            botName:
              step.chatConfig?.botName?.trim() || lastOtherName || "Neznámy",
            maxTurns: step.chatConfig?.maxTurns ?? 6,
          }
        : null,
  };
}

export function ScenarioManager() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [newScenario, setNewScenario] = useState<{
    title: string;
    slug: string;
    category: string;
    summary: string;
    steps: ScenarioStep[];
  }>({
    title: "",
    slug: "",
    category: "grooming",
    summary: "",
    steps: [
      {
        id: 0,
        key: "step-1",
        title: "Krok 1",
        situation: "",
        question: "",
        options: [
          {
            id: "opt-a",
            label: "",
            feedback: "",
            principle: "",
            riskDelta: 0,
            isSafe: true,
          },
          {
            id: "opt-b",
            label: "",
            feedback: "",
            principle: "",
            riskDelta: 0,
            isSafe: false,
          },
        ],
      },
    ],
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/scenario", { cache: "no-store" });
        const data = (await res.json()) as Scenario[];
        if (active) {
          setScenarios(data);
        }
      } catch {
        // ignore
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    void load();

    return () => {
      active = false;
    };
  }, []);

  function updateScenario(id: number, patch: Partial<Scenario>) {
    setScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }

  function updateStep(
    scenarioId: number,
    stepId: number,
    patch: Partial<ScenarioStep>
  ) {
    setScenarios((prev) =>
      prev.map((s) =>
        s.id === scenarioId
          ? {
              ...s,
              steps: s.steps.map((st) =>
                st.id === stepId ? { ...st, ...patch } : st
              ),
            }
          : s
      )
    );
  }

  function updateOption(
    scenarioId: number,
    stepId: number,
    optionId: string,
    patch: Partial<ScenarioOption>
  ) {
    setScenarios((prev) =>
      prev.map((s) =>
        s.id === scenarioId
          ? {
              ...s,
              steps: s.steps.map((st) =>
                st.id === stepId
                  ? {
                      ...st,
                      options: st.options.map((o) =>
                        o.id === optionId ? { ...o, ...patch } : o
                      ),
                    }
                  : st
              ),
            }
          : s
      )
    );
  }

  async function saveScenario(id: number) {
    const scenario = scenarios.find((s) => s.id === id);
    if (!scenario) return;
    setSavingId(id);

    try {
      const templateRes = await fetch(`/api/scenario?id=${id}`, {
        method: "PUT",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          title: scenario.title,
          summary: scenario.summary,
        }),
      });
      if (!templateRes.ok) throw new Error("template save failed");

      for (const step of scenario.steps) {
        const stepRes = await fetch(`/api/scenario?stepId=${step.id}`, {
          method: "PATCH",
          headers: csrfHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(buildStepSavePayload(step)),
        });
        if (!stepRes.ok) {
          let message = `Krok "${step.title}" sa nepodarilo uložiť.`;
          try {
            const data = (await stepRes.json()) as { error?: string };
            if (data.error) {
              message = `${message} ${data.error}`;
            }
          } catch {
            // ignore parse errors
          }
          throw new Error(message);
        }
      }
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Scenár sa nepodarilo uložiť. Skús sa znova prihlásiť a potom uložiť zmeny."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function createScenario() {
    if (!newScenario.title.trim() || !newScenario.slug.trim()) return;
    setSavingId(-1);
    try {
      const res = await fetch("/api/scenario", {
        method: "POST",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          slug: newScenario.slug.trim(),
          title: newScenario.title.trim(),
          category: newScenario.category,
          summary: newScenario.summary,
          steps: newScenario.steps.map((s, i) => ({
            key: s.key,
            title: s.title,
            order: i + 1,
            situation: s.situation,
            question: s.question,
            options: s.options,
            messages: s.messages ?? undefined,
            interactionMode: s.interactionMode ?? "multiple_choice",
            chatConfig: buildStepSavePayload(s).chatConfig ?? undefined,
          })),
        }),
      });
      if (res.ok) {
        const created = (await res.json()) as Scenario;
        setScenarios((prev) => [...prev, created]);
        setCreating(false);
        setNewScenario({
          title: "",
          slug: "",
          category: "grooming",
          summary: "",
          steps: [
            {
              id: 0,
              key: "step-1",
              title: "Krok 1",
              situation: "",
              question: "",
              options: [
                {
                  id: "opt-a",
                  label: "",
                  feedback: "",
                  principle: "",
                  riskDelta: 0,
                  isSafe: true,
                },
                {
                  id: "opt-b",
                  label: "",
                  feedback: "",
                  principle: "",
                  riskDelta: 0,
                  isSafe: false,
                },
              ],
            },
          ],
        });
      }
    } catch {
      // ignore
    } finally {
      setSavingId(null);
    }
  }

  async function deleteScenario(id: number, title: string) {
    const confirmed = window.confirm(`Zmazať scenár "${title}"?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/scenario?id=${id}`, {
        method: "DELETE",
        headers: csrfHeaders(),
      });

      if (!res.ok) {
        throw new Error("delete failed");
      }

      setScenarios((prev) => prev.filter((scenario) => scenario.id !== id));
      setExpandedId((current) => (current === id ? null : current));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="font-heading text-2xl font-bold">
            Scenáre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Načítavam scenáre...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="font-heading text-2xl font-bold flex items-center gap-2">
          <Edit3 className="size-5 text-[#EC4899]" />
          Scenáre
        </CardTitle>
        <CardDescription>
          Uprav situácie, otázky, odpovede a spätnú väzbu pre každý scenár.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!creating ? (
          <Button onClick={() => setCreating(true)}>
            <Plus data-icon="inline-start" />
            Nový scenár
          </Button>
        ) : (
          <div className="rounded-xl border bg-white p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Nový scenár</p>
              <button
                onClick={() => setCreating(false)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Názov</Label>
                <Input
                  value={newScenario.title}
                  onChange={(e) =>
                    setNewScenario((prev) => ({
                      ...prev,
                      title: e.target.value,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, ""),
                    }))
                  }
                  placeholder="napr. Nový kamarát"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={newScenario.slug}
                  onChange={(e) =>
                    setNewScenario((prev) => ({
                      ...prev,
                      slug: e.target.value,
                    }))
                  }
                  placeholder="novy-kamarat"
                />
              </div>
              <div className="space-y-2">
                <Label>Kategória</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={newScenario.category}
                  onChange={(e) =>
                    setNewScenario((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                >
                  <option value="grooming">Grooming</option>
                  <option value="phishing">Phishing</option>
                  <option value="deepfake">Deepfake</option>
                  <option value="kybersikana">Kyberšikana</option>
                  <option value="oversharing">Oversharing</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Zhrnutie</Label>
                <Textarea
                  value={newScenario.summary}
                  onChange={(e) =>
                    setNewScenario((prev) => ({
                      ...prev,
                      summary: e.target.value,
                    }))
                  }
                  rows={2}
                />
              </div>
            </div>

            {newScenario.steps.map((step, stepIdx) => (
              <div key={stepIdx} className="space-y-3 rounded-md border bg-muted/20 p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Krok {stepIdx + 1}</Badge>
                  <Input
                    className="flex-1"
                    value={step.title}
                    onChange={(e) =>
                      setNewScenario((prev) => ({
                        ...prev,
                        steps: prev.steps.map((s, i) =>
                          i === stepIdx ? { ...s, title: e.target.value } : s
                        ),
                      }))
                    }
                    placeholder="Názov kroku"
                  />
                </div>
                <Textarea
                  value={step.situation}
                  onChange={(e) =>
                    setNewScenario((prev) => ({
                      ...prev,
                      steps: prev.steps.map((s, i) =>
                        i === stepIdx
                          ? { ...s, situation: e.target.value }
                          : s
                      ),
                    }))
                  }
                  placeholder="Situácia"
                  rows={3}
                />
                <Textarea
                  value={step.question}
                  onChange={(e) =>
                    setNewScenario((prev) => ({
                      ...prev,
                      steps: prev.steps.map((s, i) =>
                        i === stepIdx
                          ? { ...s, question: e.target.value }
                          : s
                      ),
                    }))
                  }
                  placeholder="Otázka"
                  rows={2}
                />
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Odpovede</p>
                  {step.options.map((opt, optIdx) => (
                    <div key={optIdx} className="rounded-md border bg-white p-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={opt.isSafe ? "default" : "destructive"}>
                          {opt.isSafe ? "Bezpečná" : "Riziková"}
                        </Badge>
                        <Input
                          type="number"
                          className="w-24"
                          value={opt.riskDelta}
                          onChange={(e) =>
                            setNewScenario((prev) => ({
                              ...prev,
                              steps: prev.steps.map((s, i) =>
                                i === stepIdx
                                  ? {
                                      ...s,
                                      options: s.options.map((o, j) =>
                                        j === optIdx
                                          ? {
                                              ...o,
                                              riskDelta: Number(e.target.value),
                                            }
                                          : o
                                      ),
                                    }
                                  : s
                              ),
                            }))
                          }
                        />
                        <Switch
                          checked={opt.isSafe}
                          onCheckedChange={(checked) =>
                            setNewScenario((prev) => ({
                              ...prev,
                              steps: prev.steps.map((s, i) =>
                                i === stepIdx
                                  ? {
                                      ...s,
                                      options: s.options.map((o, j) =>
                                        j === optIdx
                                          ? { ...o, isSafe: checked }
                                          : o
                                      ),
                                    }
                                  : s
                              ),
                            }))
                          }
                        />
                      </div>
                      <Input
                        placeholder="Text odpovede"
                        value={opt.label}
                        onChange={(e) =>
                          setNewScenario((prev) => ({
                            ...prev,
                            steps: prev.steps.map((s, i) =>
                              i === stepIdx
                                ? {
                                    ...s,
                                    options: s.options.map((o, j) =>
                                      j === optIdx
                                        ? { ...o, label: e.target.value }
                                        : o
                                    ),
                                  }
                                : s
                            ),
                          }))
                        }
                      />
                      <Textarea
                        placeholder="Spätná väzba"
                        value={opt.feedback}
                        onChange={(e) =>
                          setNewScenario((prev) => ({
                            ...prev,
                            steps: prev.steps.map((s, i) =>
                              i === stepIdx
                                ? {
                                    ...s,
                                    options: s.options.map((o, j) =>
                                      j === optIdx
                                        ? { ...o, feedback: e.target.value }
                                        : o
                                    ),
                                  }
                                : s
                            ),
                          }))
                        }
                        rows={2}
                      />
                      <Textarea
                        placeholder="Princíp"
                        value={opt.principle}
                        onChange={(e) =>
                          setNewScenario((prev) => ({
                            ...prev,
                            steps: prev.steps.map((s, i) =>
                              i === stepIdx
                                ? {
                                    ...s,
                                    options: s.options.map((o, j) =>
                                      j === optIdx
                                        ? { ...o, principle: e.target.value }
                                        : o
                                    ),
                                  }
                                : s
                            ),
                          }))
                        }
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setNewScenario((prev) => ({
                    ...prev,
                    steps: [
                      ...prev.steps,
                      {
                        id: 0,
                        key: `step-${prev.steps.length + 1}`,
                        title: `Krok ${prev.steps.length + 1}`,
                        situation: "",
                        question: "",
                        options: [
                          {
                            id: `opt-${prev.steps.length}-a`,
                            label: "",
                            feedback: "",
                            principle: "",
                            riskDelta: 0,
                            isSafe: true,
                          },
                          {
                            id: `opt-${prev.steps.length}-b`,
                            label: "",
                            feedback: "",
                            principle: "",
                            riskDelta: 0,
                            isSafe: false,
                          },
                        ],
                      },
                    ],
                  }))
                }
              >
                + Pridať krok
              </Button>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={createScenario}
                disabled={
                  savingId === -1 ||
                  !newScenario.title.trim() ||
                  !newScenario.slug.trim()
                }
              >
                <Save data-icon="inline-start" />
                {savingId === -1 ? "Vytváram..." : "Vytvoriť scenár"}
              </Button>
            </div>
          </div>
        )}

        {scenarios.map((scenario) => {
          const isOpen = expandedId === scenario.id;
          return (
            <div
              key={scenario.id}
              className="rounded-xl border bg-white overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 py-3">
                <button
                  onClick={() => setExpandedId(isOpen ? null : scenario.id)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left hover:bg-secondary/50 transition rounded-md px-1 py-0.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <ShieldAlert className="size-5 shrink-0 text-[#EC4899]" />
                    <div className="min-w-0">
                      <p className="font-semibold">{scenario.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {threatLabels[scenario.category as keyof typeof threatLabels] ?? scenario.category}
                        {" · "}
                        {scenario.steps.length} krokov
                      </p>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="size-5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
                  )}
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteScenario(scenario.id, scenario.title)}
                  disabled={deletingId === scenario.id}
                  aria-label={`Zmazať scenár ${scenario.title}`}
                >
                  <Trash2 className="size-4 text-[#FF6B6B]" />
                </Button>
              </div>

              {isOpen && (
                <div className="border-t px-4 py-4 space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Názov scenára</Label>
                      <Input
                        value={scenario.title}
                        onChange={(e) =>
                          updateScenario(scenario.id, { title: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Popis / Zhrnutie</Label>
                      <Textarea
                        value={scenario.summary}
                        onChange={(e) =>
                          updateScenario(scenario.id, {
                            summary: e.target.value,
                          })
                        }
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {scenario.steps.map((step, stepIdx) => (
                      <div
                        key={step.id}
                        className="rounded-lg border bg-muted/30 p-4 space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Krok {stepIdx + 1}</Badge>
                          <Input
                            className="w-auto flex-1"
                            value={step.title}
                            onChange={(e) =>
                              updateStep(scenario.id, step.id, {
                                title: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Typ interakcie</Label>
                            <select
                              className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                              value={step.interactionMode ?? "multiple_choice"}
                              onChange={(e) => {
                                const interactionMode = e.target
                                  .value as ScenarioStep["interactionMode"];
                                const lastOther = [...(step.messages ?? [])]
                                  .reverse()
                                  .find((message) => message.sender === "other");

                                updateStep(scenario.id, step.id, {
                                  interactionMode,
                                  chatConfig:
                                    interactionMode === "interactive_chat"
                                      ? {
                                          botName:
                                            step.chatConfig?.botName ??
                                            lastOther?.name ??
                                            "Neznámy",
                                          maxTurns: step.chatConfig?.maxTurns ?? 6,
                                        }
                                      : undefined,
                                });
                              }}
                            >
                              <option value="multiple_choice">Výber A/B</option>
                              <option value="interactive_chat">Interaktívny chat</option>
                            </select>
                          </div>
                          {(step.interactionMode ?? "multiple_choice") ===
                          "interactive_chat" ? (
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Meno AI postavy</Label>
                                <Input
                                  value={step.chatConfig?.botName ?? ""}
                                  onChange={(e) =>
                                    updateStep(scenario.id, step.id, {
                                      chatConfig: {
                                        botName: e.target.value,
                                        maxTurns: step.chatConfig?.maxTurns ?? 6,
                                      },
                                    })
                                  }
                                  placeholder="Napr. Lukas_14"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Max. správ študenta</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={12}
                                  value={step.chatConfig?.maxTurns ?? 6}
                                  onChange={(e) =>
                                    updateStep(scenario.id, step.id, {
                                      chatConfig: {
                                        botName: step.chatConfig?.botName ?? "Neznámy",
                                        maxTurns: Number(e.target.value) || 6,
                                      },
                                    })
                                  }
                                />
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <FileText className="size-3.5" /> Situácia
                          </Label>
                          <Textarea
                            value={step.situation}
                            onChange={(e) =>
                              updateStep(scenario.id, step.id, {
                                situation: e.target.value,
                              })
                            }
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <MessageSquare className="size-3.5" /> Otázka
                          </Label>
                          <Textarea
                            value={step.question}
                            onChange={(e) =>
                              updateStep(scenario.id, step.id, {
                                question: e.target.value,
                              })
                            }
                            rows={2}
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-1">
                            <MessageCircle className="size-3.5" /> Chat správy (voliteľné)
                          </Label>
                          {(step.messages ?? []).length === 0 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateStep(scenario.id, step.id, {
                                  messages: [
                                    { sender: "other", name: "", message: "", timestamp: "" },
                                  ],
                                })
                              }
                            >
                              <Plus data-icon="inline-start" />
                              Pridať chat
                            </Button>
                          ) : (
                            <div className="space-y-2">
                              {(step.messages ?? []).map((msg, mi) => (
                                <div
                                  key={mi}
                                  className="rounded-md border bg-[#E8E8ED] p-2 space-y-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <select
                                      className="h-8 rounded border bg-white px-2 text-xs"
                                      value={msg.sender}
                                      onChange={(e) => {
                                        const updated = [...(step.messages ?? [])];
                                        updated[mi] = {
                                          ...updated[mi],
                                          sender: e.target.value as "user" | "other",
                                        };
                                        updateStep(scenario.id, step.id, { messages: updated });
                                      }}
                                    >
                                      <option value="other">Cudzia osoba</option>
                                      <option value="user">Študent</option>
                                    </select>
                                    <Input
                                      className="h-8 flex-1 text-xs"
                                      placeholder="Meno odosielateľa"
                                      value={msg.name}
                                      onChange={(e) => {
                                        const updated = [...(step.messages ?? [])];
                                        updated[mi] = { ...updated[mi], name: e.target.value };
                                        updateStep(scenario.id, step.id, { messages: updated });
                                      }}
                                    />
                                    <Input
                                      className="h-8 w-16 text-xs"
                                      placeholder="Čas"
                                      value={msg.timestamp ?? ""}
                                      onChange={(e) => {
                                        const updated = [...(step.messages ?? [])];
                                        updated[mi] = { ...updated[mi], timestamp: e.target.value };
                                        updateStep(scenario.id, step.id, { messages: updated });
                                      }}
                                    />
                                    <button
                                      onClick={() => {
                                        const updated = (step.messages ?? []).filter(
                                          (_, i) => i !== mi
                                        );
                                        updateStep(scenario.id, step.id, {
                                          messages: updated.length > 0 ? updated : null,
                                        });
                                      }}
                                      className="rounded p-1 text-muted-foreground hover:text-red-500"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
                                  <Textarea
                                    className="text-xs"
                                    placeholder="Text správy..."
                                    value={msg.message}
                                    onChange={(e) => {
                                      const updated = [...(step.messages ?? [])];
                                      updated[mi] = { ...updated[mi], message: e.target.value };
                                      updateStep(scenario.id, step.id, { messages: updated });
                                    }}
                                    rows={2}
                                  />
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newMsg: ChatMessage = { sender: "other", name: "", message: "", timestamp: "" };
                                  const updated = [
                                    ...(step.messages ?? []),
                                    newMsg,
                                  ];
                                  updateStep(scenario.id, step.id, { messages: updated });
                                }}
                              >
                                <Plus data-icon="inline-start" />
                                Pridať správu
                              </Button>
                            </div>
                          )}
                        </div>

                        {(step.interactionMode ?? "multiple_choice") ===
                        "interactive_chat" &&
                        (step.messages ?? []).length === 0 ? (
                          <p className="text-sm text-amber-700">
                            Pre interaktívny chat pridaj aspoň jednu úvodnú chat správu.
                          </p>
                        ) : null}

                        <div className="space-y-3">
                          <p className="text-sm font-semibold">
                            {(step.interactionMode ?? "multiple_choice") ===
                            "interactive_chat"
                              ? "Referenčné odpovede pre AI hodnotenie"
                              : "Odpovede"}
                          </p>
                          {step.options.map((opt) => (
                            <div
                              key={opt.id}
                              className="rounded-md border bg-white p-3 space-y-2"
                            >
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={opt.isSafe ? "default" : "destructive"}
                                >
                                  {opt.isSafe ? "Bezpečná" : "Riziková"}
                                </Badge>
                                <Input
                                  type="number"
                                  className="w-24"
                                  value={opt.riskDelta}
                                  onChange={(e) =>
                                    updateOption(
                                      scenario.id,
                                      step.id,
                                      opt.id,
                                      {
                                        riskDelta: Number(e.target.value),
                                      }
                                    )
                                  }
                                />
                              </div>
                              <Input
                                placeholder="Text odpovede"
                                value={opt.label}
                                onChange={(e) =>
                                  updateOption(
                                    scenario.id,
                                    step.id,
                                    opt.id,
                                    { label: e.target.value }
                                  )
                                }
                              />
                              <Textarea
                                placeholder="Spätná väzba"
                                value={opt.feedback}
                                onChange={(e) =>
                                  updateOption(
                                    scenario.id,
                                    step.id,
                                    opt.id,
                                    { feedback: e.target.value }
                                  )
                                }
                                rows={2}
                              />
                              <Textarea
                                placeholder="Princíp"
                                value={opt.principle}
                                onChange={(e) =>
                                  updateOption(
                                    scenario.id,
                                    step.id,
                                    opt.id,
                                    { principle: e.target.value }
                                  )
                                }
                                rows={2}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => saveScenario(scenario.id)}
                      disabled={savingId === scenario.id}
                    >
                      <Save data-icon="inline-start" />
                      {savingId === scenario.id
                        ? "Ukladám..."
                        : "Uložiť zmeny"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
