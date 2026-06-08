import { cookies } from "next/headers";
import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const AUTH_SECRET = process.env.AUTH_SECRET;
if (!AUTH_SECRET) {
  throw new Error("AUTH_SECRET environment variable is required for session security. Run: openssl rand -hex 32");
}
// TypeScript narrows after throw at top level — cast for safety
const SECRET: string = AUTH_SECRET;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const storedBuf = Buffer.from(hash, "hex");
  if (derived.length !== storedBuf.length) return false;
  return timingSafeEqual(derived, storedBuf);
}

export async function setSession(userId: number, email: string) {
  const token = `${userId}:${email}:${Date.now()}`;
  const signature = createHmac("sha256", SECRET).update(token).digest("hex");
  const cookieValue = `${token}:${signature}`;

  const cookieStore = await cookies();
  cookieStore.set("session", cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getSessionUser(): Promise<{ userId: number; email: string } | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;

  const parts = session.split(":");
  if (parts.length !== 4) return null;

  const [userIdStr, email, timestamp, signature] = parts;
  if (!userIdStr || !email || !timestamp || !signature) return null;

  const token = `${userIdStr}:${email}:${timestamp}`;
  const expected = createHmac("sha256", SECRET).update(token).digest("hex");

  try {
    if (!timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"))) {
      return null;
    }
  } catch {
    return null;
  }

  return { userId: parseInt(userIdStr, 10), email };
}
