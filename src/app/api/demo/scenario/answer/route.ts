import { z } from "zod";

import { recordScenarioAnswer } from "@/lib/demo-repository";

export const runtime = "nodejs";

const answerSchema = z.object({
  sessionToken: z.string().min(8),
  scenarioSlug: z.string().min(1),
  stepKey: z.string().min(1),
  selectedOptionId: z.string().min(1),
  attemptId: z.string().optional(),
});

export async function POST(request: Request) {
  const body = answerSchema.parse(await request.json());
  const feedback = await recordScenarioAnswer(body);

  return Response.json(feedback);
}
