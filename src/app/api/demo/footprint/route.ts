import { z } from "zod";

import { saveFootprintProfile } from "@/lib/demo-repository";

export const runtime = "nodejs";

const footprintSchema = z.object({
  sessionToken: z.string().min(8),
  publicName: z.string().min(1).max(120),
  selectedSignals: z.array(z.string()).default([]),
});

export async function POST(request: Request) {
  const body = footprintSchema.parse(await request.json());
  const summary = await saveFootprintProfile(body.sessionToken, {
    publicName: body.publicName,
    selectedSignals: body.selectedSignals,
  });

  return Response.json(summary);
}
