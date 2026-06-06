const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenRouterConfig = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

function getConfig(): { apiKey: string; model: string } {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";
  return { apiKey, model };
}

export async function chatCompletion(
  messages: ChatMessage[],
  config?: OpenRouterConfig
): Promise<string> {
  const { apiKey, model } = getConfig();

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config?.model ?? model,
      messages,
      temperature: config?.temperature ?? 0.8,
      max_tokens: config?.maxTokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return data.choices[0]?.message?.content ?? "";
}

export async function chatCompletionStructured<T>(
  messages: ChatMessage[],
  config?: OpenRouterConfig
): Promise<T> {
  const text = await chatCompletion(
    [
      ...messages,
      {
        role: "user",
        content:
          "Respond ONLY with valid JSON. Do not wrap in markdown code blocks. Do not include any other text.",
      },
    ],
    { ...config, temperature: config?.temperature ?? 0.7 }
  );

  // Strip markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  return JSON.parse(cleaned) as T;
}
