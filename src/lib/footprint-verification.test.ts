import { describe, expect, it, vi } from "vitest";

import { submitFootprintVerification } from "@/lib/footprint-client";
import {
  createEmptyFootprintAnswers,
  footprintVerificationRequestSchema,
  footprintVerificationResultSchema,
  hasMeaningfulFootprintAnswers,
} from "@/lib/footprint-verification";

describe("footprint verification schemas", () => {
  it("parses the verification request and response shapes", () => {
    const request = footprintVerificationRequestSchema.parse({
      answers: {
        bio: "V bio mám školu a vek.",
        schoolLocation: "Spomínam mestskú časť.",
        livePosting: "Dávam ranné stories zo zastávky.",
        socialGraph: "Tagujem tím a kamarátov.",
        contactAccess: "Mám otvorené DM pre všetkých.",
      },
    });

    const result = footprintVerificationResultSchema.parse({
      safetyScore: 34,
      safetyLevel: "nizka",
      profileLabel: "Príliš čitateľný profil",
      riskyProfile: {
        summary: "Z odpovedí sa dá ľahko skladať rutina aj sociálna sieť.",
        signals: [
          "Bio prepája školu a vek.",
          "Live stories ukazujú pravidelný pohyb.",
          "Otvorené DM znižujú bariéru pre cudzích ľudí.",
        ],
      },
      saferProfile: {
        summary: "Profil môže zostať osobný, ale menej presný a menej okamžitý.",
        replacements: [
          "Vyhoď školu a vek z bio.",
          "Postuj s odstupom a bez presnej lokality.",
          "Obmedz správy od neznámych účtov.",
        ],
      },
      advice: [
        {
          title: "Vyčisti bio od presných údajov",
          why: "Ak v bio necháš školu, vek alebo iný presný údaj, profil sa rýchlo spojí s konkrétnym človekom.",
        },
        {
          title: "Nezdieľaj pravidelné miesta naživo",
          why: "Live stories zo zastávky alebo z tréningu pomáhajú skladať tvoj denný režim.",
        },
        {
          title: "Obmedz tagovanie ľudí okolo seba",
          why: "Cudzí človek si tak ťažšie pospája kamarátov, rodinu a širší sociálny okruh.",
        },
        {
          title: "Skontroluj, kto ti môže písať",
          why: "Otvorené správy pre všetkých znižujú bariéru pre spam, manipuláciu aj nechcený kontakt.",
        },
        {
          title: "Nechaj profil menej presný, nie prázdny",
          why: "Nemusíš prestať zdieľať, ale pomáha, keď znížiš presnosť miesta, času a kontaktov.",
        },
      ],
    });

    expect(request.answers.bio).toContain("školu");
    expect(result.saferProfile.replacements).toHaveLength(3);
    expect(result.advice).toHaveLength(5);
    expect(result.advice[0]?.why).toContain("profil");
  });

  it("detects when all answers are empty", () => {
    expect(hasMeaningfulFootprintAnswers(createEmptyFootprintAnswers())).toBe(false);
  });

});

describe("footprint client submission", () => {
  it("refuses empty submissions and does not call the route", async () => {
    const fetchSpy = vi.fn();

    await expect(
      submitFootprintVerification(createEmptyFootprintAnswers(), fetchSpy)
    ).rejects.toThrow("Napíš aspoň jednu odpoveď");

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
