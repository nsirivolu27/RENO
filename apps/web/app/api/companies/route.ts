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

export async function GET(req: NextRequest) {
  const r = responderFor(req);
  const companies = await repo.listCompanies(r.visitorId);
  return r.json({ companies });
}

export async function POST(req: NextRequest) {
  const r = responderFor(req);
  const body = await readJsonObject(req);
  if (!body) {
    return r.json({ error: "Request body must be JSON.", code: "INVALID_BODY" }, 400);
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return r.json({ error: "A company name is required.", code: "INVALID_REQUEST" }, 400);
  }
  const trade = TRADES.includes(body.trade as CompanyTrade)
    ? (body.trade as CompanyTrade)
    : "interior_design";

  try {
    const company = await repo.createCompany(r.visitorId, {
      name,
      trade,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      tagline: typeof body.tagline === "string" ? body.tagline : undefined,
      about: typeof body.about === "string" ? body.about : undefined,
      region: typeof body.region === "string" ? body.region : undefined,
      contactEmail: typeof body.contactEmail === "string" ? body.contactEmail : undefined,
      contactPhone: typeof body.contactPhone === "string" ? body.contactPhone : undefined,
      website: typeof body.website === "string" ? body.website : undefined,
      vendorId: typeof body.vendorId === "string" ? body.vendorId : undefined,
    });
    return r.json({ company }, 201);
  } catch (err) {
    const { status, body: errBody } = storeError(err, "COMPANY_CREATE_FAILED");
    return r.json(errBody, status);
  }
}
