import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  createCompanyProfile,
  createLead,
  createOffering,
  slugify,
} from "@reno/core";
import type {
  CompanyProfile,
  CreateCompanyInput,
  CreateLeadInput,
  CreateOfferingInput,
  Lead,
  LeadStatus,
  Offering,
} from "@reno/core";

/**
 * Company portal storage: profiles, offerings and leads.
 *
 * Same pattern as the project store — an interface with a file-backed
 * implementation, serialized writes, atomic replace. Ownership is the
 * `reno_visitor` cookie until real accounts exist, so a company profile is
 * effectively "the browser that created it" for now.
 */

export interface CompanyRepository {
  listCompanies(ownerId: string): Promise<CompanyProfile[]>;
  getCompany(ownerId: string, companyId: string): Promise<CompanyProfile | null>;
  getCompanyBySlug(slug: string): Promise<CompanyProfile | null>;
  createCompany(
    ownerId: string,
    input: CreateCompanyInput
  ): Promise<CompanyProfile>;
  updateCompany(
    ownerId: string,
    companyId: string,
    patch: Partial<CreateCompanyInput>
  ): Promise<CompanyProfile>;

  listOfferings(companyId: string, publishedOnly?: boolean): Promise<Offering[]>;
  createOffering(
    ownerId: string,
    companyId: string,
    input: CreateOfferingInput
  ): Promise<Offering>;
  updateOffering(
    ownerId: string,
    offeringId: string,
    patch: Partial<CreateOfferingInput>
  ): Promise<Offering>;
  removeOffering(ownerId: string, offeringId: string): Promise<void>;

  createLead(companyId: string, input: CreateLeadInput): Promise<Lead>;
  listLeads(ownerId: string, companyId: string): Promise<Lead[]>;
  setLeadStatus(
    ownerId: string,
    leadId: string,
    status: LeadStatus
  ): Promise<Lead>;
}

interface StoredCompany extends CompanyProfile {
  ownerId: string;
}

interface CompanyDb {
  companies: StoredCompany[];
  offerings: Offering[];
  leads: Lead[];
}

const DATA_DIR = process.env.RENO_DATA_DIR || path.join(process.cwd(), ".reno-data");
const DB_PATH = path.join(DATA_DIR, "companies.json");

const MAX_COMPANIES_PER_OWNER = 5;
const MAX_OFFERINGS_PER_COMPANY = 50;
const MAX_LEADS_PER_COMPANY = 500;

let writeQueue: Promise<void> = Promise.resolve();

async function readDb(): Promise<CompanyDb> {
  try {
    const raw = await readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<CompanyDb>;
    return {
      companies: Array.isArray(parsed.companies) ? parsed.companies : [],
      offerings: Array.isArray(parsed.offerings) ? parsed.offerings : [],
      leads: Array.isArray(parsed.leads) ? parsed.leads : [],
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    return { companies: [], offerings: [], leads: [] };
  }
}

async function writeDb(db: CompanyDb): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = path.join(DATA_DIR, `companies.${randomUUID()}.tmp`);
  await writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await rename(tmp, DB_PATH);
}

async function updateDb<T>(fn: (db: CompanyDb) => T | Promise<T>): Promise<T> {
  const run = writeQueue.then(async () => {
    const db = await readDb();
    const result = await fn(db);
    await writeDb(db);
    return result;
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function ownedCompany(
  db: CompanyDb,
  ownerId: string,
  companyId: string
): StoredCompany {
  const company = db.companies.find(
    (item) => item.id === companyId && item.ownerId === ownerId
  );
  if (!company) throw new Error("COMPANY_NOT_FOUND");
  return company;
}

function publicCompany(company: StoredCompany): CompanyProfile {
  const { ownerId: _ownerId, ...profile } = company;
  return profile;
}

/** Ensures the slug is unique across all companies. */
function uniqueSlug(db: CompanyDb, desired: string): string {
  const base = slugify(desired) || `company-${Date.now().toString(36)}`;
  if (!db.companies.some((c) => c.slug === base)) return base;
  let n = 2;
  while (db.companies.some((c) => c.slug === `${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export const fileCompanyRepository: CompanyRepository = {
  async listCompanies(ownerId) {
    const db = await readDb();
    return db.companies
      .filter((c) => c.ownerId === ownerId)
      .map(publicCompany)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async getCompany(ownerId, companyId) {
    const db = await readDb();
    const company = db.companies.find(
      (c) => c.id === companyId && c.ownerId === ownerId
    );
    return company ? publicCompany(company) : null;
  },

  async getCompanyBySlug(slug) {
    const db = await readDb();
    const company = db.companies.find((c) => c.slug === slug);
    return company ? publicCompany(company) : null;
  },

  async createCompany(ownerId, input) {
    return updateDb((db) => {
      const owned = db.companies.filter((c) => c.ownerId === ownerId);
      if (owned.length >= MAX_COMPANIES_PER_OWNER) {
        throw new Error("COMPANY_LIMIT_REACHED");
      }
      const profile = createCompanyProfile(input);
      profile.slug = uniqueSlug(db, input.slug || profile.name);
      const stored: StoredCompany = { ...profile, ownerId };
      db.companies.unshift(stored);
      return publicCompany(stored);
    });
  },

  async updateCompany(ownerId, companyId, patch) {
    return updateDb((db) => {
      const company = ownedCompany(db, ownerId, companyId);
      if (patch.name !== undefined) company.name = patch.name.trim() || company.name;
      if (patch.trade !== undefined) company.trade = patch.trade;
      if (patch.tagline !== undefined) company.tagline = patch.tagline.trim() || undefined;
      if (patch.about !== undefined) company.about = patch.about.trim() || undefined;
      if (patch.region !== undefined) company.region = patch.region.trim() || undefined;
      if (patch.contactEmail !== undefined) {
        company.contactEmail = patch.contactEmail.trim() || undefined;
      }
      if (patch.contactPhone !== undefined) {
        company.contactPhone = patch.contactPhone.trim() || undefined;
      }
      if (patch.website !== undefined) company.website = patch.website.trim() || undefined;
      if (patch.vendorId !== undefined) company.vendorId = patch.vendorId.trim() || undefined;
      if (patch.slug !== undefined && slugify(patch.slug) !== company.slug) {
        company.slug = uniqueSlug(db, patch.slug);
      }
      company.updatedAt = new Date().toISOString();
      return publicCompany(company);
    });
  },

  async listOfferings(companyId, publishedOnly = false) {
    const db = await readDb();
    return db.offerings
      .filter((o) => o.companyId === companyId)
      .filter((o) => (publishedOnly ? o.status === "published" : true))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async createOffering(ownerId, companyId, input) {
    return updateDb((db) => {
      ownedCompany(db, ownerId, companyId);
      const existing = db.offerings.filter((o) => o.companyId === companyId);
      if (existing.length >= MAX_OFFERINGS_PER_COMPANY) {
        throw new Error("OFFERING_LIMIT_REACHED");
      }
      const offering = createOffering(companyId, input);
      db.offerings.unshift(offering);
      return offering;
    });
  },

  async updateOffering(ownerId, offeringId, patch) {
    return updateDb((db) => {
      const offering = db.offerings.find((o) => o.id === offeringId);
      if (!offering) throw new Error("OFFERING_NOT_FOUND");
      ownedCompany(db, ownerId, offering.companyId);

      if (patch.title !== undefined) offering.title = patch.title.trim() || offering.title;
      if (patch.summary !== undefined) offering.summary = patch.summary.trim() || undefined;
      if (patch.room !== undefined) offering.room = patch.room.trim() || offering.room;
      if (patch.style !== undefined) offering.style = patch.style.trim() || offering.style;
      if (patch.mode !== undefined) offering.mode = patch.mode;
      if (patch.status !== undefined) offering.status = patch.status;
      if (patch.inclusions !== undefined) {
        offering.inclusions = patch.inclusions
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .slice(0, 12);
      }
      if (patch.priceLow !== undefined) offering.priceLow = patch.priceLow;
      if (patch.priceHigh !== undefined) offering.priceHigh = patch.priceHigh;
      if (patch.leadTime !== undefined) offering.leadTime = patch.leadTime.trim() || undefined;
      if (patch.beforeImage !== undefined) offering.beforeImage = patch.beforeImage;
      if (patch.afterImage !== undefined) offering.afterImage = patch.afterImage;
      offering.updatedAt = new Date().toISOString();
      return offering;
    });
  },

  async removeOffering(ownerId, offeringId) {
    await updateDb((db) => {
      const offering = db.offerings.find((o) => o.id === offeringId);
      if (!offering) throw new Error("OFFERING_NOT_FOUND");
      ownedCompany(db, ownerId, offering.companyId);
      db.offerings = db.offerings.filter((o) => o.id !== offeringId);
    });
  },

  async createLead(companyId, input) {
    return updateDb((db) => {
      const company = db.companies.find((c) => c.id === companyId);
      if (!company) throw new Error("COMPANY_NOT_FOUND");
      const forCompany = db.leads.filter((l) => l.companyId === companyId);
      if (forCompany.length >= MAX_LEADS_PER_COMPANY) {
        throw new Error("LEAD_LIMIT_REACHED");
      }
      const lead = createLead(companyId, input);
      db.leads.unshift(lead);
      return lead;
    });
  },

  async listLeads(ownerId, companyId) {
    const db = await readDb();
    ownedCompany(db, ownerId, companyId);
    return db.leads
      .filter((l) => l.companyId === companyId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async setLeadStatus(ownerId, leadId, status) {
    return updateDb((db) => {
      const lead = db.leads.find((l) => l.id === leadId);
      if (!lead) throw new Error("LEAD_NOT_FOUND");
      ownedCompany(db, ownerId, lead.companyId);
      lead.status = status;
      return lead;
    });
  },
};

export function getCompanyRepository(): CompanyRepository {
  return fileCompanyRepository;
}
