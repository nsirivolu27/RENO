import type { NextRequest } from "next/server";
import { responderFor, storeError } from "@/lib/apiResponse";
import { readJsonObject } from "@/lib/projectSchema";
import { getCompanyRepository } from "@/lib/companyStore";
import type { GenerateMode, OfferingStatus } from "@reno/core";

export const runtime = "nodejs";

const repo = getCompanyRepository();

interface Ctx {
  params: Promise<{ id: string; offeringId: string }>;
}

/** Owner-only: edit an offering, including publishing and unpublishing. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const r = responderFor(req);
  const body = await readJsonObject(req);
  if (!body) {
    return r.json({ error: "Request body must be JSON.", code: "INVALID_BODY" }, 400);
  }
  try {
    const { offeringId } = await params;
    const offering = await repo.updateOffering(r.visitorId, offeringId, {
      ...(typeof body.title === "string" ? { title: body.title } : {}),
      ...(typeof body.summary === "string" ? { summary: body.summary } : {}),
      ...(typeof body.room === "string" ? { room: body.room } : {}),
      ...(typeof body.style === "string" ? { style: body.style } : {}),
      ...(body.mode === "restyle" || body.mode === "renovate"
        ? { mode: body.mode as GenerateMode }
        : {}),
      ...(body.status === "draft" || body.status === "published"
        ? { status: body.status as OfferingStatus }
        : {}),
      ...(Array.isArray(body.inclusions)
        ? {
            inclusions: body.inclusions.filter(
              (line): line is string => typeof line === "string"
            ),
          }
        : {}),
      ...(typeof body.priceLow === "number" ? { priceLow: body.priceLow } : {}),
      ...(typeof body.priceHigh === "number" ? { priceHigh: body.priceHigh } : {}),
      ...(typeof body.leadTime === "string" ? { leadTime: body.leadTime } : {}),
      ...(typeof body.beforeImage === "string"
        ? { beforeImage: body.beforeImage }
        : {}),
      ...(typeof body.afterImage === "string" ? { afterImage: body.afterImage } : {}),
    });
    return r.json({ offering });
  } catch (err) {
    const { status, body: errBody } = storeError(err, "OFFERING_NOT_FOUND");
    return r.json(errBody, status);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const r = responderFor(req);
  try {
    const { offeringId } = await params;
    await repo.removeOffering(r.visitorId, offeringId);
    return r.json({ ok: true });
  } catch (err) {
    const { status, body: errBody } = storeError(err, "OFFERING_NOT_FOUND");
    return r.json(errBody, status);
  }
}
