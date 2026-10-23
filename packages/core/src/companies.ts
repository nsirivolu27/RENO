import type { GenerateMode } from "./types";

/**
 * Company portal domain.
 *
 * The second half of Reno: design studios, furniture retailers and renovation
 * contractors publish the work they can do as **offerings**, each backed by a
 * real before/after render. A prospective customer browses that company's
 * public showcase, sees the work brought to life, and submits an enquiry —
 * which lands as a **lead** for the company.
 *
 * Offerings are drafted privately and only appear publicly once published.
 */

export type CompanyTrade =
  | "interior_design"
  | "renovation"
  | "furniture"
  | "staging"
  | "architecture";

export interface CompanyProfile {
  id: string;
  /** URL segment used at /c/<slug>. Unique, lowercase. */
  slug: string;
  name: string;
  trade: CompanyTrade;
  /** One-line positioning shown under the company name. */
  tagline?: string;
  about?: string;
  /** Service area, e.g. "Austin & surrounding". */
  region?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  /** Ties published offerings to a price list (see catalog.ts). */
  vendorId?: string;
  createdAt: string;
  updatedAt: string;
}

export type OfferingStatus = "draft" | "published";

export interface Offering {
  id: string;
  companyId: string;
  title: string;
  summary?: string;
  room: string;
  style: string;
  mode: GenerateMode;
  status: OfferingStatus;
  /** Before/after evidence — data URLs, same as project renders. */
  beforeImage?: string;
  afterImage?: string;
  /** What the company will actually deliver, as bullet points. */
  inclusions: string[];
  /** Indicative price range shown to prospects. */
  priceLow?: number;
  priceHigh?: number;
  currency: string;
  /** e.g. "3–4 weeks". */
  leadTime?: string;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus = "new" | "contacted" | "won" | "lost";

export interface Lead {
  id: string;
  companyId: string;
  /** Which offering prompted the enquiry, when known. */
  offeringId?: string;
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  /** Prospect's own space photo, if they attached one. */
  spaceImage?: string;
  status: LeadStatus;
  createdAt: string;
}

export interface CreateCompanyInput {
  name: string;
  trade: CompanyTrade;
  slug?: string;
  tagline?: string;
  about?: string;
  region?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  vendorId?: string;
}

export interface CreateOfferingInput {
  title: string;
  room: string;
  style: string;
  mode: GenerateMode;
  summary?: string;
  inclusions?: string[];
  priceLow?: number;
  priceHigh?: number;
  currency?: string;
  leadTime?: string;
  beforeImage?: string;
  afterImage?: string;
  status?: OfferingStatus;
}

export interface CreateLeadInput {
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  offeringId?: string;
  spaceImage?: string;
}

function makeId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function clean(value: string | undefined | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function cleanOptional(value: string | undefined | null): string | undefined {
  const s = clean(value);
  return s.length > 0 ? s : undefined;
}

/** URL-safe slug: lowercase, alphanumeric and single hyphens. */
export function slugify(value: string): string {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function createCompanyProfile(input: CreateCompanyInput): CompanyProfile {
  const now = new Date().toISOString();
  const name = clean(input.name) || "Untitled company";
  return {
    id: makeId(),
    slug: slugify(input.slug || name) || `company-${Date.now().toString(36)}`,
    name,
    trade: input.trade,
    tagline: cleanOptional(input.tagline),
    about: cleanOptional(input.about),
    region: cleanOptional(input.region),
    contactEmail: cleanOptional(input.contactEmail),
    contactPhone: cleanOptional(input.contactPhone),
    website: cleanOptional(input.website),
    vendorId: cleanOptional(input.vendorId),
    createdAt: now,
    updatedAt: now,
  };
}

export function createOffering(
  companyId: string,
  input: CreateOfferingInput
): Offering {
  const now = new Date().toISOString();
  return {
    id: makeId(),
    companyId,
    title: clean(input.title) || "Untitled offering",
    summary: cleanOptional(input.summary),
    room: clean(input.room) || "living room",
    style: clean(input.style) || "modern-minimal",
    mode: input.mode === "renovate" ? "renovate" : "restyle",
    // New offerings start as drafts so nothing half-finished goes public.
    status: input.status === "published" ? "published" : "draft",
    ...(input.beforeImage ? { beforeImage: input.beforeImage } : {}),
    ...(input.afterImage ? { afterImage: input.afterImage } : {}),
    inclusions: (input.inclusions ?? [])
      .map((line) => clean(line))
      .filter((line) => line.length > 0)
      .slice(0, 12),
    ...(typeof input.priceLow === "number" ? { priceLow: input.priceLow } : {}),
    ...(typeof input.priceHigh === "number" ? { priceHigh: input.priceHigh } : {}),
    currency: clean(input.currency) || "USD",
    leadTime: cleanOptional(input.leadTime),
    createdAt: now,
    updatedAt: now,
  };
}

export function createLead(companyId: string, input: CreateLeadInput): Lead {
  return {
    id: makeId(),
    companyId,
    ...(cleanOptional(input.offeringId) ? { offeringId: clean(input.offeringId) } : {}),
    name: clean(input.name) || "Unnamed enquiry",
    email: cleanOptional(input.email),
    phone: cleanOptional(input.phone),
    message: cleanOptional(input.message),
    ...(input.spaceImage ? { spaceImage: input.spaceImage } : {}),
    status: "new",
    createdAt: new Date().toISOString(),
  };
}

/** A lead is only useful if the company can reply to it. */
export function leadHasContact(lead: Pick<Lead, "email" | "phone">): boolean {
  return Boolean(lead.email || lead.phone);
}
