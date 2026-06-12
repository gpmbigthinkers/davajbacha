import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { chatCompletionStructured } from "@/lib/openrouter";
import { db } from "@/db/client";
import { scenarioSteps, scenarioTemplates } from "@/db/schema";
import { buildChatConfigFromMessages } from "@/lib/scenario-chat-verification";
import type {
  ScenarioInteractionMode,
  ThreatCategory,
} from "@/lib/platform-types";
import { rateLimitGuard } from "@/lib/rate-limit";
import { csrfGuard } from "@/lib/csrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  categories: z
    .array(z.enum(["grooming", "phishing", "deepfake", "kybersikana", "oversharing"]))
    .min(1)
    .max(5),
  scenarioCount: z.number().min(1).max(5).default(3),
  topicHint: z.string().max(200).optional(),
  interactionMode: z
    .enum(["multiple_choice", "interactive_chat"])
    .default("multiple_choice"),
});

type GeneratedMessage = {
  sender: "user" | "other";
  name: string;
  message: string;
  timestamp: string;
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
};

type GeneratedScenario = {
  slug: string;
  title: string;
  category: ThreatCategory;
  summary: string;
  accent: string;
  steps: GeneratedStep[];
};

type AiResponse = {
  scenarios: GeneratedScenario[];
};

type GeneratedStepWithMode = GeneratedStep & {
  interactionMode?: ScenarioInteractionMode;
  chatConfig?: { botName: string; maxTurns?: number };
};

type GeneratedScenarioWithMode = Omit<GeneratedScenario, "steps"> & {
  steps: GeneratedStepWithMode[];
};

function enrichScenariosForInteractionMode(
  scenarios: GeneratedScenario[],
  interactionMode: ScenarioInteractionMode
): GeneratedScenarioWithMode[] {
  if (interactionMode !== "interactive_chat") {
    return scenarios;
  }

  return scenarios.map((scenario) => ({
    ...scenario,
    steps: scenario.steps.map((step) => ({
      ...step,
      interactionMode: "interactive_chat" as const,
      chatConfig: buildChatConfigFromMessages(step.messages),
    })),
  }));
}

const SYSTEM_PROMPT = `Si expert na kybernetickú bezpečnosť pre tínedžerov na Slovensku. Tvojou úlohou je generovať realistické chatové simulácie, ktoré učia študentov rozpoznávať online hrozby.

Generuješ SCENÁRE - každý scenár simuluje chatovú konverzáciu (ako WhatsApp, Messenger, Instagram DM), kde sa študent dostane do rizikovej situácie.

DÔLEŽITÉ PRAVIDLÁ:
1. Používaj autentickú slovenčinu tínedžerov (tykanie, emoji, slang primerane veku 13-16 rokov).
2. Každý scenár musí byť realistický a presvedčivý - nie klišé.
3. **MULTI-MESSAGE CHAT**: Každý krok MUSÍ obsahovať 4-8 správ (messages), ktoré tvoria skutočnú konverzáciu. Striedaj "other" (cudzia osoba) a "user" (študent). Konverzácia sa prirodzene vyvíja - od nevinného začiatku až po rizikový moment, kde sa študent musí rozhodnúť.
4. Každý scenár má 2-3 kroky (decision points). Každý krok končí v kritickom momente, kde sa študent musí rozhodnúť medzi 2 možnosťami.
5. Každý krok má presne 2 možnosti - jedna bezpečná (isSafe: true, riskDelta záporný) a jedna riziková (isSafe: false, riskDelta kladný). Neviaž bezpečnú odpoveď na prvú pozíciu.
6. riskDelta pre bezpečnú voľbu: -10 až -25. Pre rizikovú: +15 až +40.
7. Používaj mená typické pre slovenských tínedžerov v chatových simuláciách.
8. Každý scenár musí patriť do jednej z kategórií: grooming, phishing, deepfake, kybersikana, oversharing.
9. Vytvor rôznorodé situácie - neopakuj rovnaké vzory.
10. Časy (timestamp) musia byť reálne - s odstupmi 1-5 minút medzi správami, aby to pôsobilo ako skutočný chat.
11. riskDelta je INTERNÉ skórovacie pole. V textoch pre používateľa (messages, title, question, label, feedback, principle, summary) NIKDY nespomínaj body, skóre, plus/mínus čísla, debug informácie ani zmenu rizika.

Výstup musí byť VALID JSON v tomto formáte:
{
  "scenarios": [
    {
      "slug": "url-friendly-nazov",
      "title": "Názov scenára",
      "category": "grooming|phishing|deepfake|kybersikana|oversharing",
      "summary": "Jednovetové zhrnutie scenára",
      "accent": "#EC4899",
      "steps": [
        {
          "key": "step-1",
          "title": "Názov kroku",
          "order": 1,
          "messages": [
            { "sender": "other", "name": "Lukas_14", "message": "Ahoj! Videl som tvoje story z piatku, vyzeralo to mega 🔥", "timestamp": "18:22" },
            { "sender": "user", "name": "Ty", "message": "Dík! Bolo to super, boli sme v meste", "timestamp": "18:24" },
            { "sender": "other", "name": "Lukas_14", "message": "Jasné, aj ja chodím často do mesta. Ty si z BA?", "timestamp": "18:25" },
            { "sender": "user", "name": "Ty", "message": "Hej z BA. A ty?", "timestamp": "18:27" },
            { "sender": "other", "name": "Lukas_14", "message": "Tiež! Chodím na gympel na druhej strane mesta. Nechceš pokecať na IG? Mám tam viac fotiek 😊", "timestamp": "18:28" },
            { "sender": "user", "name": "Ty", "message": "Jasné, môžme. Ako sa voláš na IG?", "timestamp": "18:30" }
          ],
          "question": "Čo urobíš?",
          "options": [
            {
              "id": "opt-a",
              "label": "Text bezpečnej odpovede",
              "feedback": "Vysvetlenie prečo je to správne",
              "principle": "Kľúčový bezpečnostný princíp",
              "riskDelta": -15,
              "isSafe": true
            },
            {
              "id": "opt-b",
              "label": "Text rizikovej odpovede",
              "feedback": "Vysvetlenie prečo je to rizikové",
              "principle": "Poučenie",
              "riskDelta": 25,
              "isSafe": false
            }
          ]
        }
      ]
    }
  ]
}`;

export async function POST(request: Request) {
  const limit = await rateLimitGuard(request, {
    storeKey: "ai-generate",
    maxRequests: 10,
    windowSeconds: 60,
  });
  if (limit) return limit;

  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csrf = await csrfGuard(request);
  if (csrf) return csrf;

  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json(
      { error: "OpenRouter API kľúč nie je nastavený. Pridaj OPENROUTER_API_KEY do .env" },
      { status: 500 }
    );
  }

  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Neplatné parametre" }, { status: 400 });
  }

  const categoryList = body.categories.join(", ");
  const topicLine = body.topicHint
    ? `\nTéma/námet od učiteľa: "${body.topicHint}"`
    : "";

  const interactiveChatInstructions =
    body.interactionMode === "interactive_chat"
      ? `

Režim interaktívneho chatu:
- Každý krok bude študent riešiť písaním vlastných správ v chate, nie výberom tlačidiel A/B.
- Pole options stále vyplň ako referenčné bezpečné a rizikové odpovede pre AI hodnotenie (label, feedback, principle).
- Otázka (question) má vyzvať študenta, čo napíše ďalej v chate.
- Konverzácia musí končiť v bode, kde je prirodzené, aby študent odpovedal vlastnou správou.`
      : "";

  const userPrompt = `Vygeneruj ${body.scenarioCount} unikátne scenáre pre kategórie: ${categoryList}.${topicLine}

Každý scenár musí mať 2-3 kroky s realistickými chatovými konverzáciami. Použi rôznorodé situácie - kombinuj rôzne platformy (Instagram, WhatsApp, TikTok, Discord, Snapchat) a rôzne typy hrozieb.${interactiveChatInstructions}

Interné riskDelta čísla patria iba do JSON poľa riskDelta. V žiadnom inom texte nesmú byť uvedené body, skóre ani hodnoty ako +25 alebo -15.

Dôležité: odpovedz IBA čistým JSON-om, bez markdown formátovania.`;

  try {
    const result = await chatCompletionStructured<AiResponse>(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.9, maxTokens: 8192 }
    );

    if (!result.scenarios || !Array.isArray(result.scenarios)) {
      return Response.json(
        { error: "AI nevrátila platné scenáre. Skús to znova." },
        { status: 500 }
      );
    }

    return Response.json({
      scenarios: enrichScenariosForInteractionMode(
        result.scenarios,
        body.interactionMode
      ),
    });
  } catch (err) {
    console.error("AI bundle generation failed:", err);
    return Response.json(
      { error: "Generovanie zlyhalo. Skús to znova." },
      { status: 500 }
    );
  }
}

// PUT: Save a generated scenario to the database
const saveSchema = z.object({
  scenario: z.object({
    slug: z.string().min(1).max(96),
    title: z.string().min(1).max(160),
    category: z.enum(["grooming", "phishing", "deepfake", "kybersikana", "oversharing"]),
    summary: z.string().min(1),
    accent: z.string().max(20).default("#EC4899"),
    steps: z.array(
      z.object({
        key: z.string(),
        title: z.string(),
        order: z.number(),
        messages: z.array(
          z.object({
            sender: z.enum(["user", "other"]),
            name: z.string(),
            message: z.string(),
            timestamp: z.string().optional(),
          })
        ).optional(),
        question: z.string(),
        options: z.array(
          z.object({
            id: z.string(),
            label: z.string(),
            feedback: z.string(),
            principle: z.string(),
            riskDelta: z.number(),
            isSafe: z.boolean(),
          })
        ),
        interactionMode: z
          .enum(["multiple_choice", "interactive_chat"])
          .optional(),
        chatConfig: z
          .object({
            botName: z.string().max(80),
            maxTurns: z.number().int().min(1).max(12).optional(),
          })
          .optional(),
      })
    ),
  }),
});

export async function PUT(request: Request) {
  const csrf = await csrfGuard(request);
  if (csrf) return csrf;

  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!db) {
    return Response.json({ error: "Databáza nie je dostupná" }, { status: 500 });
  }

  let body: z.infer<typeof saveSchema>;
  try {
    body = saveSchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Neplatné dáta scenára" }, { status: 400 });
  }

  const { scenario } = body;

  try {
    const [template] = await db
      .insert(scenarioTemplates)
      .values({
        slug: scenario.slug,
        title: scenario.title,
        threatCategory: scenario.category,
        summary: scenario.summary,
        accent: scenario.accent,
      })
      .returning();

    if (!template) {
      return Response.json({ error: "Nepodarilo sa uložiť" }, { status: 500 });
    }

    if (scenario.steps.length > 0) {
      await db.insert(scenarioSteps).values(
        scenario.steps.map((step) => ({
          scenarioId: template.id,
          stepKey: step.key,
          title: step.title,
          order: step.order,
          situation: "",
          question: step.question,
          options: step.options,
          messages: step.messages ?? null,
          interactionMode: step.interactionMode ?? "multiple_choice",
          chatConfig:
            step.interactionMode === "interactive_chat"
              ? {
                  botName:
                    step.chatConfig?.botName?.trim() ||
                    buildChatConfigFromMessages(step.messages).botName,
                  maxTurns: step.chatConfig?.maxTurns ?? 6,
                }
              : null,
        }))
      );
    }

    return Response.json({ success: true, id: template.id });
  } catch (err) {
    console.error("AI bundle save failed:", err);
    return Response.json({ error: "Ukladanie zlyhalo. Skús to znova." }, { status: 500 });
  }
}
