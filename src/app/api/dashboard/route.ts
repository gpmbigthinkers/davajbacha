import { getDashboardOverview } from "@/lib/platform-repository";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const overview = await getDashboardOverview();
  return Response.json(overview);
}
