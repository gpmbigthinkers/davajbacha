import { cookies } from "next/headers";
import { z } from "zod";

import { chatCompletion } from "@/lib/openrouter";
import { resolveScenarioStep } from "@/lib/platform-repository";
import { rateLimitGuard } from "@/lib/rate-limit";
import {
  buildScenarioChatSystemPrompt,
  countUserTurns,
  resolveBotName,
  resolveMaxTurns,
  scenarioChatRequestSchema,
} from "@/lib/scenario-chat-verification";
import type { ChatMessage, ThreatCategory } from "@/lib/platform-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatTimestamp() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export async function POST(request: Request) {
  const limit = await rateLimitGuard(request, {
    storeKey: "ai-scenario-chat",
    maxRequests: 30,
    windowSeconds: 60,
  });
  if (limit) return limit;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("davaj_bacha_session")?.value;
  if (!sessionToken) {
    return Response.json({ error: "No session" }, { status: 401 });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json(
      { error: "OpenRouter API kľúč nie je nastavený." },
      { status: 500 }
    );
  }

  let body;

  try {
    body = scenarioChatRequestSchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Neplatná správa pre chat." }, { status: 400 });
  }

  const resolved = await resolveScenarioStep({
    scenarioSlug: body.scenarioSlug,
    stepKey: body.stepKey,
  });

  if (!resolved) {
    return Response.json({ error: "Scenár sa nenašiel." }, { status: 404 });
  }

  const { scenario, step } = resolved;

  if (step.interactionMode !== "interactive_chat") {
    return Response.json(
      { error: "Tento krok nepodporuje interaktívny chat." },
      { status: 400 }
    );
  }

  const maxTurns = resolveMaxTurns(step.chatConfig);
  const currentTurns = countUserTurns(body.conversation);

  if (currentTurns >= maxTurns) {
    return Response.json(
      { error: "Dosiahol si maximálny počet správ. Odošli odpoveď na vyhodnotenie." },
      { status: 400 }
    );
  }

  const botName = resolveBotName(step.messages, step.chatConfig);
  const userMessage: ChatMessage = {
    sender: "user",
    name: "Ty",
    message: body.userMessage.trim(),
    timestamp: formatTimestamp(),
  };
  const conversation = [...body.conversation, userMessage];

  const systemPrompt = buildScenarioChatSystemPrompt({
    step: {
      title: step.title,
      question: step.question,
      messages: step.messages ?? undefined,
    },
    category: scenario.threatCategory as ThreatCategory,
    botName,
  });

  try {
    const replyText = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Pokračuj v chate. Posledná správa študenta: "${userMessage.message}"`,
        },
      ],
      { temperature: 0.85, maxTokens: 300 }
    );

    const reply: ChatMessage = {
      sender: "other",
      name: botName,
      message: replyText.trim(),
      timestamp: formatTimestamp(),
    };

    return Response.json({ reply, conversation: [...conversation, reply] });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: "Neplatná odpoveď AI." }, { status: 500 });
    }

    console.error("Scenario chat failed:", err);
    return Response.json(
      { error: "Správu sa nepodarilo odoslať. Skús to znova." },
      { status: 500 }
    );
  }
}