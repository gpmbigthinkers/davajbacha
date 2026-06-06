import { z } from "zod";

import { findUserByEmail } from "@/lib/platform-repository";
import { setSession, verifyPassword } from "@/lib/auth";
import { rateLimitGuard } from "@/lib/rate-limit";
import { setCsrfCookie } from "@/lib/csrf";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const limit = await rateLimitGuard(request, {
    storeKey: "login",
    maxRequests: 5,
    windowSeconds: 60,
  });
  if (limit) return limit;

  try {
    const body = loginSchema.parse(await request.json());
    const user = await findUserByEmail(body.email);

    if (!user) {
      // Dummy verification to prevent timing-based email enumeration
      verifyPassword(body.password, "00000000000000000000000000000000:00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");
      return Response.json({ error: "Nesprávny email alebo heslo" }, { status: 401 });
    }

    if (!verifyPassword(body.password, user.passwordHash)) {
      return Response.json({ error: "Nesprávny email alebo heslo" }, { status: 401 });
    }

    await setSession(user.id, user.email);
    await setCsrfCookie();

    return Response.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch {
    return Response.json({ error: "Neplatný formulár" }, { status: 400 });
  }
}
