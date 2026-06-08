import { getHomepageStats } from "@/lib/platform-repository";
import { rateLimitGuard } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limit = await rateLimitGuard(request, {
    storeKey: "stats",
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (limit) return limit;

  const stats = await getHomepageStats();
  return Response.json(stats);
}
