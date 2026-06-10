import { cookies } from "next/headers";
import { z } from "zod";

import { recordScenarioAnswers } from "@/lib/platform-repository";
import { rateLimitGuard } from "@/lib/rate-limit";

export const runtime = "nodejs";

const answersSchema = z.object({
  answers: z.array(
    z.object({
      scenarioSlug: z.string().min(1).max(96),
      stepKey: z.string().min(1).max(96),
      selectedOptionId: z.string().min(1).max(96),
    })
  ).min(1),
});

export async function POST(request: Request) {
  const limit = await rateLimitGuard(request, {
    storeKey: "answers",
    maxRequests: 10,
    windowSeconds: 60,
  });
  if (limit) return limit;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("davaj_bacha_session")?.value;
  if (!sessionToken) {
    return Response.json({ error: "No session" }, { status: 401 });
  }

  const body = answersSchema.parse(await request.json());
  const result = await recordScenarioAnswers({
    sessionToken,
    answers: body.answers,
  });

  return Response.json(result);
}
