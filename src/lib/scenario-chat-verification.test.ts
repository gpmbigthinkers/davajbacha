import { describe, expect, it } from "vitest";

import {
  buildScenarioChatSystemPrompt,
  buildScenarioEvaluationUserPrompt,
  countUserTurns,
  extractLatestUserMessage,
  mapEvaluationToFeedback,
  resolveBotName,
  resolveMaxTurns,
} from "@/lib/scenario-chat-verification";

describe("scenario-chat-verification", () => {
  const options = [
    {
      id: "safe",
      label: "Nastavím hranicu a poviem dospelému.",
      feedback: "Správne.",
      principle: "Hranice chránia.",
      riskDelta: -20,
      isSafe: true,
    },
    {
      id: "risky",
      label: "Pošlem fotku, aby bol pokoj.",
      feedback: "Rizikové.",
      principle: "Tlak na fotku je signál.",
      riskDelta: 30,
      isSafe: false,
    },
  ];

  it("counts user turns and resolves bot name from scripted messages", () => {
    const messages = [
      { sender: "other" as const, name: "Lukas_14", message: "Ahoj" },
      { sender: "user" as const, name: "Ty", message: "Čau" },
    ];

    expect(countUserTurns(messages)).toBe(1);
    expect(resolveBotName(messages)).toBe("Lukas_14");
    expect(resolveBotName(messages, { botName: "CustomBot" })).toBe("CustomBot");
  });

  it("clamps max turns to a safe range", () => {
    expect(resolveMaxTurns()).toBe(6);
    expect(resolveMaxTurns({ botName: "Bot", maxTurns: 0 })).toBe(1);
    expect(resolveMaxTurns({ botName: "Bot", maxTurns: 99 })).toBe(12);
  });

  it("builds prompts with reference options and category context", () => {
    const systemPrompt = buildScenarioChatSystemPrompt({
      step: {
        title: "Tlak",
        question: "Čo napíšeš?",
        messages: [
          { sender: "other", name: "Lukas_14", message: "Pošli fotku" },
        ],
      },
      category: "grooming",
      botName: "Lukas_14",
    });

    const evaluationPrompt = buildScenarioEvaluationUserPrompt({
      step: {
        title: "Tlak",
        question: "Čo napíšeš?",
        options,
      },
      category: "grooming",
      conversation: [
        { sender: "other", name: "Lukas_14", message: "Pošli fotku" },
        { sender: "user", name: "Ty", message: "Nie, nepošlem." },
      ],
    });

    expect(systemPrompt).toContain("Lukas_14");
    expect(systemPrompt).toContain("Grooming");
    expect(evaluationPrompt).toContain("Referenčné odpovede");
    expect(evaluationPrompt).toContain("safe");
    expect(evaluationPrompt).toContain("Nie, nepošlem.");
  });

  it("maps evaluation to feedback using matched option risk delta", () => {
    const feedback = mapEvaluationToFeedback(
      {
        isSafe: true,
        matchedOptionId: "safe",
        feedback: "Dobrá reakcia.",
        principle: "Hranice.",
      },
      options,
      "attempt-1"
    );

    expect(feedback).toEqual({
      attemptId: "attempt-1",
      isSafe: true,
      riskDelta: -20,
      feedback: "Dobrá reakcia.",
      principle: "Hranice.",
      matchedOptionId: "safe",
    });
  });

  it("extracts the latest user message", () => {
    expect(
      extractLatestUserMessage([
        { sender: "other", name: "A", message: "Hej" },
        { sender: "user", name: "Ty", message: "Prvá" },
        { sender: "user", name: "Ty", message: "Druhá" },
      ])
    ).toBe("Druhá");
  });
});