import { NextResponse } from "next/server";
import { z } from "zod";

import { createAnonSession } from "@/lib/platform-repository";
import { rateLimitGuard } from "@/lib/rate-limit";

export const runtime = "nodejs";

const sessionSchema = z.object({
  presentationMode: z.boolean().optional().default(false),
  entryCode: z.string().optional(),
});

export async function POST(request: Request) {
  const limit = await rateLimitGuard(request, {
    storeKey: "session",
    maxRequests: 30,
    windowSeconds: 60,
  });
  if (limit) return limit;

  const body = sessionSchema.parse(await request.json().catch(() => ({})));
  const session = await createAnonSession(
    body.presentationMode,
    body.entryCode
  );

  if (!session.stored && "error" in session) {
    return NextResponse.json(
      { error: session.error },
      { status: 401 }
    );
  }

  const response = NextResponse.json(session);

  response.cookies.set("davaj_bacha_session", session.sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
