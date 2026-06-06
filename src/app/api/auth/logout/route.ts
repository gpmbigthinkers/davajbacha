import { clearSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  await clearSession();
  return Response.json({ success: true });
}
