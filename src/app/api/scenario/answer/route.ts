import { cookies } from "next/headers";
import { z } from "zod";

import { recordScenarioAnswer } from "@/lib/platform-repository";
import { rateLimitGuard } from "@/lib/rate-limit";

export const runtime = "nodejs";

const answerSchema = z.object({
  scenarioSlug: z.string().min(1).max(96),
  stepKey: z.string().min(1).max(96),
  selectedOptionId: z.string().min(1).max(96),
  attemptId: z.string().max(36).optional(),
});

export async function POST(request: Request) {
  const limit = await rateLimitGuard(request, {
    storeKey: "answer",
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (limit) return limit;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("davaj_bacha_session")?.value;
  if (!sessionToken) {
    return Response.json({ error: "No session" }, { status: 401 });
  }

  const body = answerSchema.parse(await request.json());
  const feedback = await recordScenarioAnswer({
    sessionToken,
    ...body,
  });

  return Response.json(feedback);
}
