import { z } from "zod";

import {
  footprintVerificationRequestSchema,
  footprintVerificationResultSchema,
  formatFootprintAnswersForPrompt,
  hasMeaningfulFootprintAnswers,
} from "@/lib/footprint-verification";
import { chatCompletionStructured } from "@/lib/openrouter";
import { rateLimitGuard } from "@/lib/rate-limit";
import type { FootprintVerificationResult } from "@/lib/platform-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Si mentor digitálnej bezpečnosti pre tínedžerov na Slovensku.

Tvoja úloha je vyhodnotiť odpovede študenta o tom, čo má verejne viditeľné na Instagrame alebo na iných sociálnych platformách.

Pravidlá:
1. Hodnoť LEN to, čo je napísané v odpovediach. Nevymýšľaj fakty ani detaily.
2. Ak je odpoveď neurčitá alebo krátka, pomenuj neistotu priamo v texte namiesto domýšľania.
3. safetyScore je číslo 0 až 100, kde vyššie číslo znamená bezpečnejší profil.
4. safetyLevel musí byť presne jedna z hodnôt: nizka, stredna, vysoka.
5. profileLabel musí byť krátky názov profilu, max. pár slov.
6. riskyProfile.summary stručne vysvetlí, čo sa dá z profilu odvodiť.
7. riskyProfile.signals musia byť presne 3 stručné rizikové signály.
8. saferProfile.summary stručne opíše bezpečnejšiu verziu podobného profilu.
9. saferProfile.replacements musia byť presne 3 konkrétne bezpečnejšie náhrady.
10. advice musí obsahovať presne 5 odporúčaní pre študenta.
11. Každé odporúčanie v advice musí mať:
   - title: krátka akčná veta, čo má študent spraviť
   - why: 1 až 2 vety, prečo to pomôže práve pri tomto profile
12. Odporúčania nesmú byť všeobecné frázy. Musia reagovať na konkrétne signály z odpovedí študenta.
13. Ak odpovede ukazujú minimum verejných signálov, nepíš alarmisticky a nevymýšľaj riziká. Namiesto toho použi udržiavacie odporúčania a jasne povedz, že profil už pôsobí bezpečne.
14. Píš po slovensky, prirodzene, zrozumiteľne pre vek 13-16 rokov.
15. Nevkladaj markdown, úvodné vety, vysvetlenia mimo JSON ani debug text.

Výstup musí byť validný JSON v presnom formáte:
{
  "safetyScore": 68,
  "safetyLevel": "stredna",
  "profileLabel": "Ľahko čitateľný profil",
  "riskyProfile": {
    "summary": "Krátke zhrnutie rizikového profilu.",
    "signals": ["signál 1", "signál 2", "signál 3"]
  },
  "saferProfile": {
    "summary": "Krátke zhrnutie bezpečnejšej verzie profilu.",
    "replacements": ["náhrada 1", "náhrada 2", "náhrada 3"]
  },
  "advice": [
    {
      "title": "Odstráň presný údaj z bio",
      "why": "Presný údaj v bio pomáha rýchlo spojiť profil so školou, vekom alebo konkrétnym človekom."
    },
    {
      "title": "Dávaj stories s odstupom",
      "why": "Keď neukazuješ miesto naživo, je ťažšie odhadnúť, kde sa práve nachádzaš a aký máš režim."
    },
    {
      "title": "Obmedz tagovanie blízkych",
      "why": "Cudzí človek si tak nevie tak ľahko vyskladať tvoju rodinu a sociálne väzby."
    },
    {
      "title": "Skontroluj, kto ti môže písať",
      "why": "Menšia dostupnosť pre neznámych znižuje priestor na nátlak, manipuláciu a spam."
    },
    {
      "title": "Nechaj profil osobný, ale menej presný",
      "why": "Nemusíš prestať zdieľať, stačí znížiť presnosť údajov o mieste, čase a ľuďoch okolo teba."
    }
  ]
}`;

export async function POST(request: Request) {
  const limit = await rateLimitGuard(request, {
    storeKey: "ai-verify",
    maxRequests: 10,
    windowSeconds: 60,
  });
  if (limit) return limit;

  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json(
      { error: "OpenRouter API kľúč nie je nastavený. Pridaj OPENROUTER_API_KEY do .env" },
      { status: 500 }
    );
  }

  let body;

  try {
    body = footprintVerificationRequestSchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Neplatné odpovede pre overenie profilu." }, { status: 400 });
  }

  if (!hasMeaningfulFootprintAnswers(body.answers)) {
    return Response.json(
      { error: "Napíš aspoň jednu odpoveď, aby sa profil dal overiť." },
      { status: 400 }
    );
  }

  const userPrompt = `Vyhodnoť tento profilový self-audit. Použi iba uvedené odpovede.

${formatFootprintAnswersForPrompt(body.answers)}

Odpovedz iba čistým JSON-om podľa zadaného formátu.`;

  try {
    const rawResult = await chatCompletionStructured<FootprintVerificationResult>(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.4, maxTokens: 2400 }
    );

    const result = footprintVerificationResultSchema.parse(rawResult);
    return Response.json(result);
  } catch (err) {
    if (err instanceof z.ZodError || err instanceof SyntaxError) {
      return Response.json(
        { error: "AI nevrátila platnú analýzu profilu. Skús to znova." },
        { status: 500 }
      );
    }

    console.error("Footprint verification failed:", err);
    return Response.json(
      { error: "Profil sa nepodarilo overiť. Skús to znova." },
      { status: 500 }
    );
  }
}
