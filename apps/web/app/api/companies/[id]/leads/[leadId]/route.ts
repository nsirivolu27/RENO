import type { NextRequest } from "next/server";
import { responderFor, storeError } from "@/lib/apiResponse";
import { readJsonObject } from "@/lib/projectSchema";
import { getCompanyRepository } from "@/lib/companyStore";
import type { LeadStatus } from "@reno/core";

export const runtime = "nodejs";

const repo = getCompanyRepository();

const STATUSES: LeadStatus[] = ["new", "contacted", "won", "lost"];

interface Ctx {
  params: Promise<{ id: string; leadId: string }>;
}

/** Owner-only: move a lead through the pipeline. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const r = responderFor(req);
  const body = await readJsonObject(req);
  if (!body || !STATUSES.includes(body.status as LeadStatus)) {
    return r.json(
      {
        error: "status must be new, contacted, won or lost.",
        code: "INVALID_REQUEST",
      },
      400
    );
  }
  try {
    const { leadId } = await params;
    const lead = await repo.setLeadStatus(
      r.visitorId,
      leadId,
      body.status as LeadStatus
    );
    return r.json({ lead });
  } catch (err) {
    const { status, body: errBody } = storeError(err, "LEAD_NOT_FOUND");
    return r.json(errBody, status);
  }
}
