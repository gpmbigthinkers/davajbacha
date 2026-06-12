import { z } from "zod";

import {
  getScenarioTemplatesWithSteps,
  updateScenarioTemplate,
  updateScenarioStep,
  createScenarioTemplate,
  deleteScenarioTemplate,
} from "@/lib/platform-repository";
import { getSessionUser } from "@/lib/auth";
import { csrfGuard } from "@/lib/csrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  slug: z.string().min(1).max(96),
  title: z.string().min(1).max(160),
  category: z.string().min(1),
  summary: z.string().min(1),
  accent: z.string().max(20).optional(),
  steps: z.array(
    z.object({
      key: z.string(),
      title: z.string(),
      order: z.number(),
      situation: z.string().min(1).max(2000),
      question: z.string(),
      messages: z
        .array(
          z.object({
            sender: z.enum(["user", "other"]),
            name: z.string(),
            message: z.string(),
            timestamp: z.string().optional(),
          })
        )
        .optional(),
      options: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          feedback: z.string(),
          principle: z.string(),
          riskDelta: z.number(),
          isSafe: z.boolean(),
        })
      ),
      interactionMode: z.enum(["multiple_choice", "interactive_chat"]).optional(),
      chatConfig: z
        .object({
          botName: z.string().min(1).max(80),
          maxTurns: z.number().int().min(1).max(12).optional(),
        })
        .optional(),
    })
  ),
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
    const created = await createScenarioTemplate(body);

    if (!created) {
      return Response.json(
        { error: "Nepodarilo sa vytvoriť scenár" },
        { status: 500 }
      );
    }

    return Response.json(created);
  } catch {
    return Response.json({ error: "Neplatný formulár" }, { status: 400 });
  }
}

export async function GET() {
  const scenarios = await getScenarioTemplatesWithSteps();
  return Response.json(scenarios);
}

const updateTemplateSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  summary: z.string().min(1).optional(),
  accent: z.string().max(20).optional(),
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

    const body = updateTemplateSchema.parse(await request.json());
    const updated = await updateScenarioTemplate(id, body);

    if (!updated) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json(updated);
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
}

const updateStepSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  situation: z.string().min(1).max(2000).optional(),
  question: z.string().min(1).max(500).optional(),
  messages: z
    .array(
      z.object({
        sender: z.enum(["user", "other"]),
        name: z.string(),
        message: z.string(),
        timestamp: z.string().optional(),
      })
    )
    .nullable()
    .optional(),
  options: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        feedback: z.string(),
        principle: z.string(),
        riskDelta: z.number(),
        isSafe: z.boolean(),
      })
    )
    .optional(),
  interactionMode: z.enum(["multiple_choice", "interactive_chat"]).optional(),
  chatConfig: z
    .object({
      botName: z.string().min(1).max(80),
      maxTurns: z.number().int().min(1).max(12).optional(),
    })
    .nullable()
    .optional(),
});

export async function PATCH(request: Request) {
  const csrf = await csrfGuard(request);
  if (csrf) return csrf;

  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const stepId = Number(url.searchParams.get("stepId"));
    if (!stepId) {
      return Response.json({ error: "Missing stepId" }, { status: 400 });
    }

    const body = updateStepSchema.parse(await request.json());
    const updated = await updateScenarioStep(stepId, body);

    if (!updated) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json(updated);
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
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

    const deleted = await deleteScenarioTemplate(id);
    if (!deleted) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({ success: true, id: deleted.id });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
