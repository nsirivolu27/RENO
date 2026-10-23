import type { NextRequest } from "next/server";
import { responderFor, storeError } from "@/lib/apiResponse";
import { readJsonObject } from "@/lib/projectSchema";
import { getCompanyRepository } from "@/lib/companyStore";
import type { CompanyTrade } from "@reno/core";

export const runtime = "nodejs";

const repo = getCompanyRepository();

const TRADES: CompanyTrade[] = [
  "interior_design",
  "renovation",
  "furniture",
  "staging",
  "architecture",
];

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const r = responderFor(req);
  const { id } = await params;
  const company = await repo.getCompany(r.visitorId, id);
  if (!company) {
    return r.json({ error: "Company not found.", code: "COMPANY_NOT_FOUND" }, 404);
  }
  return r.json({ company });
}

/** Owner-only: edit the public profile. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const r = responderFor(req);
  const body = await readJsonObject(req);
  if (!body) {
    return r.json({ error: "Request body must be JSON.", code: "INVALID_BODY" }, 400);
  }
  const text = (key: string): string | undefined =>
    typeof body[key] === "string" ? (body[key] as string) : undefined;

  try {
    const { id } = await params;
    const company = await repo.updateCompany(r.visitorId, id, {
      ...(text("name") !== undefined ? { name: text("name") as string } : {}),
      ...(TRADES.includes(body.trade as CompanyTrade)
        ? { trade: body.trade as CompanyTrade }
        : {}),
      ...(text("slug") !== undefined ? { slug: text("slug") } : {}),
      ...(text("tagline") !== undefined ? { tagline: text("tagline") } : {}),
      ...(text("about") !== undefined ? { about: text("about") } : {}),
      ...(text("region") !== undefined ? { region: text("region") } : {}),
      ...(text("contactEmail") !== undefined
        ? { contactEmail: text("contactEmail") }
        : {}),
      ...(text("contactPhone") !== undefined
        ? { contactPhone: text("contactPhone") }
        : {}),
      ...(text("website") !== undefined ? { website: text("website") } : {}),
      ...(text("vendorId") !== undefined ? { vendorId: text("vendorId") } : {}),
    });
    return r.json({ company });
  } catch (err) {
    const { status, body: errBody } = storeError(err, "COMPANY_NOT_FOUND");
    return r.json(errBody, status);
  }
}
