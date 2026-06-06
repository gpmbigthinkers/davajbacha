import { z } from "zod";

import type {
  FootprintQuestion,
  FootprintVerificationAnswers,
  FootprintVerificationRequest,
  FootprintVerificationResult,
} from "@/lib/platform-types";

export const footprintQuestions = [
  {
    id: "bio",
    label: "1. Čo máš v bio alebo handle?",
    description:
      "Napíš, čo je verejne viditeľné hneď na profile. Môže to byť nick, bio text, vek, škola alebo čokoľvek podobné.",
    placeholder: "Napr. názov školy v bio, vek, mesto, tímové emoji, prezývka...",
  },
  {
    id: "schoolLocation",
    label: "2. Spomínaš školu, triedu, mesto alebo štvrť?",
    description:
      "Ak máš niekde uvedené, kde chodíš do školy alebo odkiaľ si, opíš to vlastnými slovami.",
    placeholder: "Napr. gymnázium, trieda, mesto, mestská časť, zastávka, okolie...",
  },
  {
    id: "livePosting",
    label: "3. Čo zverejňuješ naživo alebo krátko po tom?",
    description:
      "Zaujíma nás hlavne, či postuješ stories z cesty do školy, zo zastávky, krúžku alebo iných pravidelných miest.",
    placeholder: "Napr. ranná story zo zastávky, fotka z tréningu, live z mesta po škole...",
  },
  {
    id: "socialGraph",
    label: "4. Ukazuješ alebo označuješ kamarátov, rodinu, tím alebo klub?",
    description:
      "Napíš, koho bežne ukazuješ na verejnom profile a či ich taguješ alebo spomínaš menom.",
    placeholder: "Napr. tagujem spolužiakov, dávam fotky sestry, označujem klub alebo tím...",
  },
  {
    id: "contactAccess",
    label: "5. Zverejňuješ kontakt alebo si ľahko dostupný/á cudzím ľuďom?",
    description:
      "Napíš, či máš verejný kontakt, link, otvorené správy alebo iný jednoduchý spôsob, ako ťa môže osloviť neznámy človek.",
    placeholder: "Napr. verejný mail, telefón, link na chat, otvorené DM pre všetkých...",
  },
] as const satisfies readonly FootprintQuestion[];

export function createEmptyFootprintAnswers(): FootprintVerificationAnswers {
  return {
    bio: "",
    schoolLocation: "",
    livePosting: "",
    socialGraph: "",
    contactAccess: "",
  };
}

export function normalizeFootprintAnswers(
  answers: FootprintVerificationAnswers
): FootprintVerificationAnswers {
  return {
    bio: answers.bio.trim(),
    schoolLocation: answers.schoolLocation.trim(),
    livePosting: answers.livePosting.trim(),
    socialGraph: answers.socialGraph.trim(),
    contactAccess: answers.contactAccess.trim(),
  };
}

export function hasMeaningfulFootprintAnswers(
  answers: FootprintVerificationAnswers
) {
  return Object.values(normalizeFootprintAnswers(answers)).some(Boolean);
}

export function formatFootprintAnswersForPrompt(
  answers: FootprintVerificationAnswers
) {
  const normalized = normalizeFootprintAnswers(answers);

  return footprintQuestions
    .map((question) => {
      const answer = normalized[question.id] || "Neuviedol/a nič konkrétne.";
      return `${question.label}\nOdpoveď: ${answer}`;
    })
    .join("\n\n");
}

const answerSchema = z.string().max(700);

export const footprintVerificationRequestSchema = z.object({
  answers: z.object({
    bio: answerSchema,
    schoolLocation: answerSchema,
    livePosting: answerSchema,
    socialGraph: answerSchema,
    contactAccess: answerSchema,
  }),
}) satisfies z.ZodType<FootprintVerificationRequest>;

export const footprintVerificationResultSchema = z.object({
  safetyScore: z.number().int().min(0).max(100),
  safetyLevel: z.enum(["nizka", "stredna", "vysoka"]),
  profileLabel: z.string().min(1).max(120),
  riskyProfile: z.object({
    summary: z.string().min(1),
    signals: z.array(z.string().min(1)).length(3),
  }),
  saferProfile: z.object({
    summary: z.string().min(1),
    replacements: z.array(z.string().min(1)).length(3),
  }),
  advice: z.array(
    z.object({
      title: z.string().min(6).max(140),
      why: z.string().min(20).max(280),
    })
  ).length(5),
}) satisfies z.ZodType<FootprintVerificationResult>;
