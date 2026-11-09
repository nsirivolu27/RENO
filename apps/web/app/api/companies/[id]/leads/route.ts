import type { NextRequest } from "next/server";
import { responderFor, storeError } from "@/lib/apiResponse";
import { readJsonObject } from "@/lib/projectSchema";
import { getCompanyRepository } from "@/lib/companyStore";

export const runtime = "nodejs";

const repo = getCompanyRepository();

interface Ctx {
  params: Promise<{ id: string }>;
}

/** Owner-only: the company's enquiry inbox. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const r = responderFor(req);
  const { id } = await params;
  try {
    const leads = await repo.listLeads(r.visitorId, id);
    return r.json({ leads });
  } catch (err) {
    const { status, body } = storeError(err, "COMPANY_NOT_FOUND");
    return r.json(body, status);
  }
}

/** Public: a prospect submits an enquiry from the showcase page. */
export async function POST(req: NextRequest, { params }: Ctx) {
  const r = responderFor(req);
  const body = await readJsonObject(req);
  if (!body) {
    return r.json({ error: "Request body must be JSON.", code: "INVALID_BODY" }, 400);
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!name || (!email && !phone)) {
    return r.json(
      {
        error: "Please include your name and either an email or a phone number.",
        code: "INVALID_REQUEST",
      },
      400
    );
  }
  try {
    const { id } = await params;
    const lead = await repo.createLead(id, {
      name,
      email: email || undefined,
      phone: phone || undefined,
      message: typeof body.message === "string" ? body.message : undefined,
      offeringId: typeof body.offeringId === "string" ? body.offeringId : undefined,
    });
    // Never echo the whole lead back to a public caller.
    return r.json({ ok: true, leadId: lead.id }, 201);
  } catch (err) {
    const { status, body: errBody } = storeError(err, "COMPANY_NOT_FOUND");
    return r.json(errBody, status);
  }
}
