import {
  scenarioChatRequestSchema,
  scenarioEvaluateRequestSchema,
} from "@/lib/scenario-chat-verification";
import type { ChatMessage, ScenarioFeedback } from "@/lib/platform-types";

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export class ScenarioChatError extends Error {}

export async function sendScenarioChatMessage(
  input: {
    scenarioSlug: string;
    stepKey: string;
    conversation: ChatMessage[];
    userMessage: string;
  },
  fetchImpl: FetchLike = fetch
): Promise<ChatMessage> {
  const payload = scenarioChatRequestSchema.parse(input);

  const response = await fetchImpl("/api/ai/scenario-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "Správu sa nepodarilo odoslať. Skús to znova.";

    throw new ScenarioChatError(message);
  }

  if (
    !data ||
    typeof data !== "object" ||
    !("reply" in data) ||
    typeof data.reply !== "object" ||
    data.reply === null
  ) {
    throw new ScenarioChatError("Neplatná odpoveď servera.");
  }

  return data.reply as ChatMessage;
}

export async function submitScenarioEvaluation(
  input: {
    scenarioSlug: string;
    stepKey: string;
    conversation: ChatMessage[];
    attemptId?: string;
  },
  fetchImpl: FetchLike = fetch
): Promise<ScenarioFeedback> {
  const payload = scenarioEvaluateRequestSchema.parse(input);

  const response = await fetchImpl("/api/scenario/evaluate-response", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "Odpoveď sa nepodarilo vyhodnotiť. Skús to znova.";

    throw new ScenarioChatError(message);
  }

  return data as ScenarioFeedback;
}