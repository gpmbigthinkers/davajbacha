import { NextResponse } from "next/server";
import { z } from "zod";

import { createAnonSession } from "@/lib/demo-repository";

export const runtime = "nodejs";

const sessionSchema = z.object({
  presentationMode: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const body = sessionSchema.parse(await request.json().catch(() => ({})));
  const session = await createAnonSession(body.presentationMode);
  const response = NextResponse.json(session);

  response.cookies.set("davaj_bacha_session", session.sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
