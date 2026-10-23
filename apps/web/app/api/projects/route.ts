import type { NextRequest } from "next/server";
import { responderFor, storeError } from "@/lib/apiResponse";
import { readJsonObject } from "@/lib/projectSchema";
import { getProjectRepository } from "@/lib/projectRepository";

export const runtime = "nodejs";

const repo = getProjectRepository();

export async function GET(req: NextRequest) {
  const r = responderFor(req);
  const projects = await repo.list(r.visitorId);
  return r.json({ projects });
}

export async function POST(req: NextRequest) {
  const r = responderFor(req);
  const body = await readJsonObject(req);
  if (!body) {
    return r.json({ error: "Request body must be JSON.", code: "INVALID_BODY" }, 400);
  }
  try {
    const project = await repo.create(r.visitorId, body);
    return r.json({ project }, 201);
  } catch (err) {
    const { status, body: errBody } = storeError(err, "PROJECT_CREATE_FAILED");
    return r.json(errBody, status);
  }
}
