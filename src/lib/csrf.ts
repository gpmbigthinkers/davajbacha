import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const CSRF_SECRET = process.env.AUTH_SECRET;

function getCsrfSecret(): string {
  if (!CSRF_SECRET) {
    throw new Error("AUTH_SECRET is required for CSRF protection");
  }
  return CSRF_SECRET;
}

/**
 * Set a CSRF token cookie on login. The token is a random value,
 * optionally HMAC-signed for additional integrity.
 */
export async function setCsrfCookie() {
  const token = randomBytes(32).toString("hex");
  const cookieStore = await cookies();

  cookieStore.set("csrf_token", token, {
    httpOnly: false, // JS needs to read it for the header
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

/**
 * Verify that the X-CSRF-Token header matches the CSRF cookie.
 * Returns true if valid, false otherwise.
 */
export async function verifyCsrf(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("csrf_token")?.value;
  if (!cookieToken) return false;

  const headerToken = request.headers.get("x-csrf-token");
  if (!headerToken) return false;

  try {
    return timingSafeEqual(
      Buffer.from(cookieToken, "hex"),
      Buffer.from(headerToken, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Guard: returns 403 if CSRF check fails, null if OK.
 */
export async function csrfGuard(request: Request): Promise<Response | null> {
  // Skip CSRF for GET/HEAD/OPTIONS
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return null;
  }

  const valid = await verifyCsrf(request);
  if (!valid) {
    return new Response(
      JSON.stringify({ error: "Neplatný CSRF token" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  return null;
}
