import { z } from "zod";

import {
  deactivateEntryCode,
  generateEntryCode,
  getActiveEntryCodes,
  validateEntryCode,
} from "@/lib/platform-repository";
import { getSessionUser } from "@/lib/auth";
import { csrfGuard } from "@/lib/csrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code) {
    const row = await validateEntryCode(code);
    if (!row) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json(row);
  }

  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const codes = await getActiveEntryCodes();
  return Response.json(codes);
}

const createSchema = z.object({
  classId: z.number().optional(),
  bundleId: z.number().optional(),
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
    const code = await generateEntryCode(body.classId, body.bundleId);

    if (!code) {
      return Response.json(
        { error: "Nepodarilo sa vygenerovať kód" },
        { status: 500 }
      );
    }

    return Response.json(code);
  } catch {
    return Response.json({ error: "Neplatný formulár" }, { status: 400 });
  }
}

const deleteSchema = z.object({
  id: z.number().int().positive(),
});

export async function DELETE(request: Request) {
  const csrf = await csrfGuard(request);
  if (csrf) return csrf;

  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = deleteSchema.parse(await request.json());
    const code = await deactivateEntryCode(body.id);

    if (!code) {
      return Response.json({ error: "Kód sa nenašiel" }, { status: 404 });
    }

    return Response.json({ success: true, id: code.id });
  } catch {
    return Response.json({ error: "Neplatná požiadavka" }, { status: 400 });
  }
}
