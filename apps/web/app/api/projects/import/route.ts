import type { NextRequest } from "next/server";
import { responderFor, storeError } from "@/lib/apiResponse";
import { readJsonObject } from "@/lib/projectSchema";
import { getProjectRepository } from "@/lib/projectRepository";

export const runtime = "nodejs";

const repo = getProjectRepository();

export async function POST(req: NextRequest) {
  const r = responderFor(req);
  const body = await readJsonObject(req);
  if (!body) {
    return r.json({ error: "Request body must be JSON.", code: "INVALID_BODY" }, 400);
  }
  try {
    const project = await repo.import(r.visitorId, body);
    return r.json({ project }, 201);
  } catch (err) {
    // Unknown failures fall back to INVALID_PROJECT; a genuine capacity error
    // now surfaces its own PROJECT_LIMIT_REACHED code instead of being masked.
    const { status, body: errBody } = storeError(err, "INVALID_PROJECT");
    return r.json(errBody, status);
  }
}
