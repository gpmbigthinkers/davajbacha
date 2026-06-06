import {
  footprintVerificationRequestSchema,
  footprintVerificationResultSchema,
  hasMeaningfulFootprintAnswers,
  normalizeFootprintAnswers,
} from "@/lib/footprint-verification";
import type {
  FootprintVerificationAnswers,
  FootprintVerificationResult,
} from "@/lib/platform-types";

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export class FootprintVerificationError extends Error {}

export async function submitFootprintVerification(
  answers: FootprintVerificationAnswers,
  fetchImpl: FetchLike = fetch
): Promise<FootprintVerificationResult> {
  if (!hasMeaningfulFootprintAnswers(answers)) {
    throw new FootprintVerificationError(
      "Napíš aspoň jednu odpoveď, aby sa profil dal overiť."
    );
  }

  const payload = footprintVerificationRequestSchema.parse({
    answers: normalizeFootprintAnswers(answers),
  });

  const response = await fetchImpl("/api/ai/verify-footprint", {
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
        : "Profil sa nepodarilo overiť. Skús to znova.";

    throw new FootprintVerificationError(message);
  }

  return footprintVerificationResultSchema.parse(data);
}
