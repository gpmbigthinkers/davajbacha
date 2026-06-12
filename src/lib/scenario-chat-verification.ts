import { z } from "zod";

import { threatLabels } from "@/lib/platform-data";
import type {
  ChatMessage,
  ScenarioChatConfig,
  ScenarioFeedback,
  ScenarioOption,
  ScenarioStep,
  ThreatCategory,
} from "@/lib/platform-types";

export const DEFAULT_MAX_TURNS = 6;
export const MAX_CHAT_MESSAGE_LENGTH = 500;

const chatMessageSchema = z.object({
  sender: z.enum(["user", "other"]),
  name: z.string().min(1).max(80),
  message: z.string().min(1).max(MAX_CHAT_MESSAGE_LENGTH),
  timestamp: z.string().max(16).optional(),
});

export const scenarioChatRequestSchema = z.object({
  scenarioSlug: z.string().min(1).max(96),
  stepKey: z.string().min(1).max(96),
  conversation: z.array(chatMessageSchema).max(40),
  userMessage: z.string().min(1).max(MAX_CHAT_MESSAGE_LENGTH),
});

export const scenarioEvaluateRequestSchema = z.object({
  scenarioSlug: z.string().min(1).max(96),
  stepKey: z.string().min(1).max(96),
  conversation: z.array(chatMessageSchema).min(1).max(40),
  attemptId: z.string().max(36).optional(),
});

export const scenarioEvaluationResultSchema = z.object({
  isSafe: z.boolean(),
  matchedOptionId: z.string().min(1).max(96),
  feedback: z.string().min(1).max(1000),
  principle: z.string().min(1).max(500),
});

export type ScenarioEvaluationResult = z.infer<
  typeof scenarioEvaluationResultSchema
>;

export function countUserTurns(conversation: ChatMessage[]) {
  return conversation.filter((message) => message.sender === "user").length;
}

export function resolveMaxTurns(chatConfig?: ScenarioChatConfig | null) {
  const maxTurns = chatConfig?.maxTurns ?? DEFAULT_MAX_TURNS;
  return Math.min(Math.max(maxTurns, 1), 12);
}

export function buildChatConfigFromMessages(
  messages?: ChatMessage[] | null
): ScenarioChatConfig {
  return {
    botName: resolveBotName(messages),
    maxTurns: DEFAULT_MAX_TURNS,
  };
}

export function resolveBotName(
  messages: ChatMessage[] | null | undefined,
  chatConfig?: ScenarioChatConfig | null
) {
  if (chatConfig?.botName?.trim()) {
    return chatConfig.botName.trim();
  }

  const lastOther = [...(messages ?? [])]
    .reverse()
    .find((message) => message.sender === "other");

  return lastOther?.name ?? "Neznámy";
}

export function formatConversationForPrompt(conversation: ChatMessage[]) {
  return conversation
    .map((message) => {
      const role = message.sender === "user" ? "Študent" : message.name;
      return `${role}: ${message.message}`;
    })
    .join("\n");
}

export function formatReferenceOptionsForPrompt(options: ScenarioOption[]) {
  return options
    .map((option) => {
      const safety = option.isSafe ? "bezpečná" : "riziková";
      return [
        `ID: ${option.id}`,
        `Typ: ${safety}`,
        `Referenčná odpoveď: ${option.label}`,
        `Spätná väzba: ${option.feedback}`,
        `Princíp: ${option.principle}`,
      ].join("\n");
    })
    .join("\n\n");
}

export function buildScenarioChatSystemPrompt(input: {
  step: Pick<ScenarioStep, "title" | "question" | "messages">;
  category: ThreatCategory;
  botName: string;
}) {
  const categoryLabel = threatLabels[input.category];
  const scriptedContext = formatConversationForPrompt(input.step.messages ?? []);

  return `Si postava v bezpečnostnom tréningu pre tínedžerov na Slovensku. Hráš rolu "${input.botName}" v simulácii kategórie ${categoryLabel}.

Kontext kroku: ${input.step.title}
Otázka pre študenta: ${input.step.question}

Doterajšia konverzácia:
${scriptedContext || "Žiadna predchádzajúca konverzácia."}

Pravidlá:
1. Odpovedaj LEN ako ${input.botName}, v autentickej slovenčine tínedžerov (tykanie, emoji primerane).
2. Pokračuj prirodzene z poslednej správy. Nepíš meta komentáre, vysvetlenia ani hodnotenie.
3. Drž sa témy scenára (${categoryLabel}). Nepýtaj sa na skutočné osobné údaje (adresu, telefón, heslo, fotky).
4. Odpovede majú byť krátke — 1 až 3 vety, ako v chate.
5. Ak študent odmietne alebo nastaví hranicu, reaguj presvedčivo, ale neeskaluj násilím.
6. Nikdy nespomínaj body, skóre, AI, simulátor ani bezpečnostné hodnotenie.`;
}

export function buildScenarioEvaluationSystemPrompt() {
  return `Si mentor digitálnej bezpečnosti pre tínedžerov na Slovensku.

Vyhodnoť, ako študent reagoval v interaktívnom chate. Hodnoť LEN správy od študenta (nie správy postavy).

Pravidlá:
1. Porovnaj študentove odpovede s referenčnými bezpečnými a rizikovými odpoveďami.
2. isSafe je true, ak študent celkovo reagoval bezpečne; inak false.
3. matchedOptionId musí byť presne ID referenčnej odpovede, ktorej je reakcia študenta najbližšia.
4. feedback a principle napíš po slovensky, zrozumiteľne pre vek 13-16, na mieru konkrétnej reakcii študenta.
5. Ak je reakcia nejednoznačná, zvoľ matchedOptionId rizikovej referenčnej odpovede a isSafe: false.
6. Nevkladaj markdown ani text mimo JSON.

Výstup musí byť validný JSON:
{
  "isSafe": true,
  "matchedOptionId": "opt-a",
  "feedback": "Stručné vysvetlenie pre študenta.",
  "principle": "Bezpečnostný princíp."
}`;
}

export function buildScenarioEvaluationUserPrompt(input: {
  step: Pick<ScenarioStep, "title" | "question" | "options">;
  category: ThreatCategory;
  conversation: ChatMessage[];
}) {
  const categoryLabel = threatLabels[input.category];
  const studentMessages = input.conversation
    .filter((message) => message.sender === "user")
    .map((message) => message.message)
    .join("\n");

  return `Kategória: ${categoryLabel}
Krok: ${input.step.title}
Otázka: ${input.step.question}

Celá konverzácia:
${formatConversationForPrompt(input.conversation)}

Správy študenta (hodnotiť tieto):
${studentMessages || "Študent neodoslal žiadnu správu."}

Referenčné odpovede:
${formatReferenceOptionsForPrompt(input.step.options)}`;
}

export function mapEvaluationToFeedback(
  evaluation: ScenarioEvaluationResult,
  options: ScenarioOption[],
  attemptId?: string
): ScenarioFeedback {
  const matched =
    options.find((option) => option.id === evaluation.matchedOptionId) ??
    options.find((option) => option.isSafe === evaluation.isSafe) ??
    options.find((option) => !option.isSafe) ??
    options[0];

  const resolvedOption =
    evaluation.isSafe && matched && !matched.isSafe
      ? (options.find((option) => option.isSafe) ?? matched)
      : !evaluation.isSafe && matched && matched.isSafe
        ? (options.find((option) => !option.isSafe) ?? matched)
        : matched;

  return {
    attemptId,
    isSafe: evaluation.isSafe,
    riskDelta: resolvedOption?.riskDelta ?? 0,
    feedback: evaluation.feedback,
    principle: evaluation.principle,
    matchedOptionId: resolvedOption?.id ?? evaluation.matchedOptionId,
  };
}

export function extractLatestUserMessage(conversation: ChatMessage[]) {
  const userMessages = conversation.filter((message) => message.sender === "user");
  return userMessages.at(-1)?.message ?? "";
}