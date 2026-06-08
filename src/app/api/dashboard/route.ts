import { getDashboardOverview } from "@/lib/platform-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const overview = await getDashboardOverview();

  return Response.json(overview);
}
