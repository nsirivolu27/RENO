import type { NextRequest } from "next/server";
import { responderFor, storeError } from "@/lib/apiResponse";
import { getProjectRepository } from "@/lib/projectRepository";

export const runtime = "nodejs";

const repo = getProjectRepository();

interface ShareRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: ShareRouteContext) {
  const r = responderFor(req);
  const { id } = await params;
  const shared = await repo.getShare(r.visitorId, id);
  return r.json({
    shared: Boolean(shared),
    shareId: shared?.shareId ?? null,
    url: shared ? `/r/${shared.shareId}` : null,
  });
}

export async function POST(req: NextRequest, { params }: ShareRouteContext) {
  const r = responderFor(req);
  try {
    const { id } = await params;
    const shared = await repo.enableShare(r.visitorId, id);
    return r.json({ ...shared, url: `/r/${shared.shareId}` });
  } catch (err) {
    const { status, body: errBody } = storeError(err, "PROJECT_NOT_FOUND");
    return r.json(errBody, status);
  }
}

export async function DELETE(req: NextRequest, { params }: ShareRouteContext) {
  const r = responderFor(req);
  try {
    const { id } = await params;
    const project = await repo.disableShare(r.visitorId, id);
    return r.json({ project });
  } catch (err) {
    const { status, body: errBody } = storeError(err, "PROJECT_NOT_FOUND");
    return r.json(errBody, status);
  }
}
