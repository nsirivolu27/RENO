import type { NextRequest } from "next/server";
import { responderFor, storeError } from "@/lib/apiResponse";
import { readJsonObject } from "@/lib/projectSchema";
import { getProjectRepository } from "@/lib/projectRepository";

export const runtime = "nodejs";

const repo = getProjectRepository();

interface ProjectRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: ProjectRouteContext) {
  const r = responderFor(req);
  const { id } = await params;
  const project = await repo.get(r.visitorId, id);
  if (!project) {
    return r.json({ error: "Project not found.", code: "PROJECT_NOT_FOUND" }, 404);
  }
  return r.json({ project });
}

export async function PATCH(req: NextRequest, { params }: ProjectRouteContext) {
  const r = responderFor(req);
  const body = await readJsonObject(req);
  if (!body) {
    return r.json({ error: "Request body must be JSON.", code: "INVALID_BODY" }, 400);
  }
  try {
    const { id } = await params;
    const project = await repo.update(r.visitorId, id, body);
    return r.json({ project });
  } catch (err) {
    const { status, body: errBody } = storeError(err, "PROJECT_NOT_FOUND");
    return r.json(errBody, status);
  }
}

export async function DELETE(req: NextRequest, { params }: ProjectRouteContext) {
  const r = responderFor(req);
  const { id } = await params;
  try {
    await repo.remove(r.visitorId, id);
    return r.json({ ok: true });
  } catch (err) {
    const { status, body: errBody } = storeError(err, "PROJECT_NOT_FOUND");
    return r.json(errBody, status);
  }
}
