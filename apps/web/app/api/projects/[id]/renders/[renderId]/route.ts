import type { NextRequest } from "next/server";
import { responderFor, storeError } from "@/lib/apiResponse";
import { readFavorite, readJsonObject } from "@/lib/projectSchema";
import { getProjectRepository } from "@/lib/projectRepository";

export const runtime = "nodejs";

const repo = getProjectRepository();

interface RenderItemRouteContext {
  params: Promise<{ id: string; renderId: string }>;
}

export async function PATCH(
  req: NextRequest,
  { params }: RenderItemRouteContext
) {
  const r = responderFor(req);
  const body = await readJsonObject(req);
  if (!body) {
    return r.json({ error: "Request body must be JSON.", code: "INVALID_BODY" }, 400);
  }
  try {
    const { id, renderId } = await params;
    const project = await repo.setRenderFavorite(
      r.visitorId,
      id,
      renderId,
      readFavorite(body)
    );
    return r.json({ project });
  } catch (err) {
    const { status, body: errBody } = storeError(err, "RENDER_NOT_FOUND");
    return r.json(errBody, status);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RenderItemRouteContext
) {
  const r = responderFor(req);
  try {
    const { id, renderId } = await params;
    const project = await repo.removeRender(r.visitorId, id, renderId);
    return r.json({ project });
  } catch (err) {
    const { status, body: errBody } = storeError(err, "RENDER_NOT_FOUND");
    return r.json(errBody, status);
  }
}
