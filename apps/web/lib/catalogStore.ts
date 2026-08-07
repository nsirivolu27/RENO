import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { SAMPLE_CATALOG, SAMPLE_VENDORS } from "@reno/core";
import type { CatalogItem, ItemCategory, Vendor } from "@reno/core";

/**
 * Vendor/price catalog storage.
 *
 * Ships with the sample catalog from `@reno/core` so estimates work out of the
 * box. If `$RENO_DATA_DIR/catalog.json` exists it wins, which is how an
 * operator loads their own vendor price list without a code change.
 *
 * Same shape as `ProjectRepository`: an interface first, a file implementation
 * behind it, so a hosted database can replace this later.
 */

export interface CatalogQuery {
  style?: string;
  room?: string;
  category?: ItemCategory;
  vendorId?: string;
  /** Exclude renovate-only items (surfaces, fixtures, labor). */
  furnishingsOnly?: boolean;
}

export interface CatalogSnapshot {
  vendors: Vendor[];
  items: CatalogItem[];
  /** "sample" when using the bundled data, "custom" when operator-supplied. */
  source: "sample" | "custom";
}

export interface CatalogRepository {
  load(): Promise<CatalogSnapshot>;
  query(query: CatalogQuery): Promise<CatalogSnapshot>;
  /** Replace the catalog with an operator-supplied price list. */
  replace(vendors: Vendor[], items: CatalogItem[]): Promise<CatalogSnapshot>;
}

const DATA_DIR = process.env.RENO_DATA_DIR || path.join(process.cwd(), ".reno-data");
const CATALOG_PATH = path.join(DATA_DIR, "catalog.json");

interface CatalogFile {
  vendors: unknown;
  items: unknown;
}

function isVendor(value: unknown): value is Vendor {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && typeof v.name === "string";
}

function isCatalogItem(value: unknown): value is CatalogItem {
  if (typeof value !== "object" || value === null) return false;
  const i = value as Record<string, unknown>;
  return (
    typeof i.id === "string" &&
    typeof i.vendorId === "string" &&
    typeof i.name === "string" &&
    typeof i.category === "string" &&
    typeof i.priceLow === "number" &&
    typeof i.priceHigh === "number" &&
    Array.isArray(i.styleTags) &&
    Array.isArray(i.roomTags)
  );
}

async function readCustomCatalog(): Promise<CatalogSnapshot | null> {
  try {
    const raw = await readFile(CATALOG_PATH, "utf8");
    const parsed = JSON.parse(raw) as CatalogFile;
    const vendors = Array.isArray(parsed.vendors)
      ? parsed.vendors.filter(isVendor)
      : [];
    const items = Array.isArray(parsed.items)
      ? parsed.items.filter(isCatalogItem)
      : [];
    if (vendors.length === 0 || items.length === 0) return null;
    return { vendors, items, source: "custom" };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    return null;
  }
}

function sampleSnapshot(): CatalogSnapshot {
  return { vendors: SAMPLE_VENDORS, items: SAMPLE_CATALOG, source: "sample" };
}

export const fileCatalogRepository: CatalogRepository = {
  async load() {
    return (await readCustomCatalog()) ?? sampleSnapshot();
  },

  async query(query) {
    const snapshot = await this.load();
    const items = snapshot.items.filter((item) => {
      if (query.vendorId && item.vendorId !== query.vendorId) return false;
      if (query.category && item.category !== query.category) return false;
      if (query.furnishingsOnly && item.renovateOnly) return false;
      if (
        query.style &&
        item.styleTags.length > 0 &&
        !item.styleTags.includes(query.style)
      ) {
        return false;
      }
      if (
        query.room &&
        item.roomTags.length > 0 &&
        !item.roomTags.includes(query.room)
      ) {
        return false;
      }
      return true;
    });

    // Only return vendors that still have matching items.
    const vendorIds = new Set(items.map((item) => item.vendorId));
    return {
      vendors: snapshot.vendors.filter((vendor) => vendorIds.has(vendor.id)),
      items,
      source: snapshot.source,
    };
  },

  async replace(vendors, items) {
    await mkdir(DATA_DIR, { recursive: true });
    const tmp = path.join(DATA_DIR, `catalog.${randomUUID()}.tmp`);
    await writeFile(tmp, JSON.stringify({ vendors, items }, null, 2), "utf8");
    await rename(tmp, CATALOG_PATH);
    return { vendors, items, source: "custom" };
  },
};

export function getCatalogRepository(): CatalogRepository {
  return fileCatalogRepository;
}
