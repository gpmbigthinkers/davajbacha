import { cookies } from "next/headers";
import { z } from "zod";

import { chatCompletionStructured } from "@/lib/openrouter";
import {
  recordScenarioFreeResponse,
  resolveScenarioStep,
} from "@/lib/platform-repository";
import { rateLimitGuard } from "@/lib/rate-limit";
import {
  buildScenarioEvaluationSystemPrompt,
  buildScenarioEvaluationUserPrompt,
  countUserTurns,
  extractLatestUserMessage,
  mapEvaluationToFeedback,
  scenarioEvaluateRequestSchema,
  scenarioEvaluationResultSchema,
  type ScenarioEvaluationResult,
} from "@/lib/scenario-chat-verification";
import type { ThreatCategory } from "@/lib/platform-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = await rateLimitGuard(request, {
    storeKey: "scenario-evaluate",
    maxRequests: 10,
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
    body = scenarioEvaluateRequestSchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Neplatná konverzácia na vyhodnotenie." }, { status: 400 });
  }

  if (countUserTurns(body.conversation) < 1) {
    return Response.json(
      { error: "Najprv napíš aspoň jednu správu." },
      { status: 400 }
    );
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
      { error: "Tento krok nepodporuje vyhodnotenie chatu." },
      { status: 400 }
    );
  }

  const evaluationPrompt = buildScenarioEvaluationUserPrompt({
    step: {
      title: step.title,
      question: step.question,
      options: step.options,
    },
    category: scenario.threatCategory as ThreatCategory,
    conversation: body.conversation,
  });

  try {
    const rawResult = await chatCompletionStructured<ScenarioEvaluationResult>(
      [
        { role: "system", content: buildScenarioEvaluationSystemPrompt() },
        { role: "user", content: evaluationPrompt },
      ],
      { temperature: 0.35, maxTokens: 1200 }
    );

    const evaluation = scenarioEvaluationResultSchema.parse(rawResult);
    const feedback = mapEvaluationToFeedback(
      evaluation,
      step.options,
      body.attemptId
    );

    const persisted = await recordScenarioFreeResponse({
      sessionToken,
      scenarioSlug: body.scenarioSlug,
      stepKey: body.stepKey,
      attemptId: body.attemptId,
      feedback,
      conversation: body.conversation,
      freeTextAnswer: extractLatestUserMessage(body.conversation),
    });

    return Response.json(persisted);
  } catch (err) {
    if (err instanceof z.ZodError || err instanceof SyntaxError) {
      return Response.json(
        { error: "AI nevrátila platné hodnotenie. Skús to znova." },
        { status: 500 }
      );
    }

    console.error("Scenario evaluation failed:", err);
    return Response.json(
      { error: "Odpoveď sa nepodarilo vyhodnotiť. Skús to znova." },
      { status: 500 }
    );
  }
}