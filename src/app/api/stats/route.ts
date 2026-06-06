import { getHomepageStats } from "@/lib/platform-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await getHomepageStats();
  return Response.json(stats);
}
