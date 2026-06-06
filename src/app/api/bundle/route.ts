import { z } from "zod";

import {
  getBundles,
  getBundleScenarios,
  createBundle,
  updateBundle,
} from "@/lib/platform-repository";
import { getSessionUser } from "@/lib/auth";
import { csrfGuard } from "@/lib/csrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bundleId = url.searchParams.get("id");

  if (bundleId) {
    const scenarios = await getBundleScenarios(Number(bundleId));
    return Response.json(scenarios);
  }

  const bundles = await getBundles();
  return Response.json(bundles);
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
  scenarioIds: z.array(z.number()).default([]),
  classId: z.number().optional(),
});

export async function POST(request: Request) {
  const csrf = await csrfGuard(request);
  if (csrf) return csrf;

  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = createSchema.parse(await request.json());
    const bundle = await createBundle(
      body.name,
      body.scenarioIds,
      body.classId
    );
    if (!bundle) {
      return Response.json(
        { error: "Nepodarilo sa vytvoriť balík" },
        { status: 500 }
      );
    }
    return Response.json(bundle);
  } catch {
    return Response.json({ error: "Neplatný formulár" }, { status: 400 });
  }
}

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  active: z.boolean().optional(),
  scenarioIds: z.array(z.number()).optional(),
});

export async function PUT(request: Request) {
  const csrf = await csrfGuard(request);
  if (csrf) return csrf;

  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const id = Number(url.searchParams.get("id"));
    if (!id) {
      return Response.json({ error: "Missing id" }, { status: 400 });
    }

    const body = updateSchema.parse(await request.json());
    const updated = await updateBundle(id, body);

    if (!updated) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json(updated);
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
}
