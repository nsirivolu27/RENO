import type { NextRequest } from "next/server";
import { responderFor, storeError } from "@/lib/apiResponse";
import { readJsonObject } from "@/lib/projectSchema";
import { getProjectRepository } from "@/lib/projectRepository";

export const runtime = "nodejs";

const repo = getProjectRepository();

interface RenderRouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RenderRouteContext) {
  const r = responderFor(req);
  const body = await readJsonObject(req);
  if (!body) {
    return r.json({ error: "Request body must be JSON.", code: "INVALID_BODY" }, 400);
  }
  try {
    const { id } = await params;
    const render = await repo.addRender(r.visitorId, id, body);
    return r.json({ render }, 201);
  } catch (err) {
    const { status, body: errBody } = storeError(err, "RENDER_CREATE_FAILED");
    return r.json(errBody, status);
  }
}
