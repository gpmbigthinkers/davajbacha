import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("POST /api/ai/verify-footprint", () => {
  it("returns structured JSON for valid answers", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.doMock("@/lib/openrouter", () => ({
      chatCompletionStructured: vi.fn().mockResolvedValue({
        safetyScore: 71,
        safetyLevel: "vysoka",
        profileLabel: "Premyslenejší profil",
        riskyProfile: {
          summary: "Stále sa dá niečo odčítať, ale menej presne.",
          signals: [
            "Bio ešte naznačuje vekovú skupinu.",
            "Stories občas ukazujú opakované miesta.",
            "Tagy odhaľujú sociálny okruh.",
          ],
        },
        saferProfile: {
          summary: "Profil je menej presný a ťažšie čitateľný.",
          replacements: [
            "Bio necháva len všeobecný opis.",
            "Príspevky idú s časovým odstupom.",
            "Tagovanie je obmedzené na súkromné kontexty.",
          ],
        },
        advice: [
          {
            title: "Skry presné verejné údaje z bio",
            why: "Bio je prvé miesto, kde si cudzí človek rýchlo spojí školu, vek alebo iný presný identifikátor.",
          },
          {
            title: "Nezdieľaj pravidelné miesta naživo",
            why: "Keď nevie niekto tvoje miesto v reálnom čase, ťažšie si poskladá tvoju rutinu.",
          },
          {
            title: "Obmedz verejné tagovanie ľudí",
            why: "Tagy pomáhajú skladať tvoj sociálny okruh a kontaktné väzby.",
          },
          {
            title: "Otvorené DM nechaj len pre známych",
            why: "Znížiš tým priestor pre spam, manipulačné správy aj neželaný kontakt.",
          },
          {
            title: "Zdieľaj menej presne, nie menej osobne",
            why: "Profil môže zostať autentický aj bez presných miest, časov a citlivých detailov.",
          },
        ],
      }),
    }));

    const { POST } = await import("@/app/api/ai/verify-footprint/route");
    const response = await POST(
      new Request("http://localhost/api/ai/verify-footprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: {
            bio: "Mám v bio vek a školu.",
            schoolLocation: "Spomínam mestskú časť.",
            livePosting: "Dávam stories zo zastávky.",
            socialGraph: "Tagujem tím.",
            contactAccess: "Mám otvorené DM.",
          },
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      safetyScore: 71,
      safetyLevel: "vysoka",
      riskyProfile: { signals: expect.any(Array) },
      saferProfile: { replacements: expect.any(Array) },
      advice: expect.any(Array),
    });
  });

  it("returns 500 when the API key is missing", async () => {
    vi.unstubAllEnvs();
    delete process.env.OPENROUTER_API_KEY;

    const { POST } = await import("@/app/api/ai/verify-footprint/route");
    const response = await POST(
      new Request("http://localhost/api/ai/verify-footprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: {
            bio: "Niečo v bio.",
            schoolLocation: "",
            livePosting: "",
            socialGraph: "",
            contactAccess: "",
          },
        }),
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "OpenRouter API kľúč nie je nastavený. Pridaj OPENROUTER_API_KEY do .env",
    });
  });

  it("returns 400 for an invalid request shape", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.doMock("@/lib/openrouter", () => ({
      chatCompletionStructured: vi.fn(),
    }));

    const { POST } = await import("@/app/api/ai/verify-footprint/route");
    const response = await POST(
      new Request("http://localhost/api/ai/verify-footprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: {
            bio: "Niečo v bio.",
          },
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Neplatné odpovede pre overenie profilu.",
    });
  });


  it("returns a controlled error for malformed AI output", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.doMock("@/lib/openrouter", () => ({
      chatCompletionStructured: vi.fn().mockResolvedValue({
        safetyScore: 22,
        safetyLevel: "nizka",
      }),
    }));

    const { POST } = await import("@/app/api/ai/verify-footprint/route");
    const response = await POST(
      new Request("http://localhost/api/ai/verify-footprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: {
            bio: "Mám v bio vek a školu.",
            schoolLocation: "",
            livePosting: "",
            socialGraph: "",
            contactAccess: "",
          },
        }),
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "AI nevrátila platnú analýzu profilu. Skús to znova.",
    });
  });
});
