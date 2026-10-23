import type { NextRequest } from "next/server";
import { responderFor, storeError } from "@/lib/apiResponse";
import { readJsonObject } from "@/lib/projectSchema";
import { getCompanyRepository } from "@/lib/companyStore";
import type { GenerateMode, OfferingStatus } from "@reno/core";

export const runtime = "nodejs";

const repo = getCompanyRepository();

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const r = responderFor(req);
  const { id } = await params;
  // Owners see drafts; everyone else sees published only.
  const owned = await repo.getCompany(r.visitorId, id);
  const offerings = await repo.listOfferings(id, !owned);
  return r.json({ offerings, canEdit: Boolean(owned) });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const r = responderFor(req);
  const body = await readJsonObject(req);
  if (!body) {
    return r.json({ error: "Request body must be JSON.", code: "INVALID_BODY" }, 400);
  }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return r.json({ error: "An offering title is required.", code: "INVALID_REQUEST" }, 400);
  }
  try {
    const { id } = await params;
    const offering = await repo.createOffering(r.visitorId, id, {
      title,
      room: typeof body.room === "string" ? body.room : "living room",
      style: typeof body.style === "string" ? body.style : "modern-minimal",
      mode: (body.mode === "renovate" ? "renovate" : "restyle") as GenerateMode,
      summary: typeof body.summary === "string" ? body.summary : undefined,
      inclusions: Array.isArray(body.inclusions)
        ? body.inclusions.filter((i): i is string => typeof i === "string")
        : undefined,
      priceLow: typeof body.priceLow === "number" ? body.priceLow : undefined,
      priceHigh: typeof body.priceHigh === "number" ? body.priceHigh : undefined,
      leadTime: typeof body.leadTime === "string" ? body.leadTime : undefined,
      beforeImage: typeof body.beforeImage === "string" ? body.beforeImage : undefined,
      afterImage: typeof body.afterImage === "string" ? body.afterImage : undefined,
      status: (body.status === "published" ? "published" : "draft") as OfferingStatus,
    });
    return r.json({ offering }, 201);
  } catch (err) {
    const { status, body: errBody } = storeError(err, "OFFERING_CREATE_FAILED");
    return r.json(errBody, status);
  }
}
