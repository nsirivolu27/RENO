import type { CatalogItem, Vendor } from "./catalog";

/**
 * Sample catalog shipped with Reno.
 *
 * These are plausible mid-market US prices used to demonstrate the estimate
 * feature — they are NOT quotes and no vendor here is a real partner. Replace
 * this with your own vendor data (see docs/CATALOG.md) before showing numbers
 * to a paying client.
 */

export const SAMPLE_VENDORS: Vendor[] = [
  {
    id: "northline",
    name: "Northline Furniture",
    kind: "furniture_store",
    region: "Nationwide",
  },
  {
    id: "atelier-9",
    name: "Atelier Nine Interiors",
    kind: "design_studio",
    region: "Metro",
  },
  {
    id: "brightwork",
    name: "Brightwork Renovations",
    kind: "renovation_contractor",
    region: "Metro",
  },
  {
    id: "lumen-co",
    name: "Lumen & Co. Lighting",
    kind: "furniture_store",
    region: "Nationwide",
  },
  {
    id: "openmarket",
    name: "Open Market",
    kind: "marketplace",
    region: "Nationwide",
  },
];

const USD = "USD";

/** Helper keeps the seed table readable. */
function item(
  id: string,
  vendorId: string,
  name: string,
  category: CatalogItem["category"],
  priceLow: number,
  priceHigh: number,
  options: Partial<
    Pick<CatalogItem, "styleTags" | "roomTags" | "renovateOnly" | "unit">
  > = {}
): CatalogItem {
  return {
    id,
    vendorId,
    name,
    category,
    priceLow,
    priceHigh,
    currency: USD,
    styleTags: options.styleTags ?? [],
    roomTags: options.roomTags ?? [],
    ...(options.renovateOnly ? { renovateOnly: true } : {}),
    ...(options.unit ? { unit: options.unit } : {}),
  };
}

export const SAMPLE_CATALOG: CatalogItem[] = [
  // ---- Furniture ---------------------------------------------------------
  item("nl-sofa-linen", "northline", "Linen sectional sofa", "furniture", 1400, 2600, {
    styleTags: ["modern-minimal", "scandinavian", "coastal", "japandi"],
    roomTags: ["living room", "basement"],
  }),
  item("nl-sofa-leather", "northline", "Cognac leather sofa", "furniture", 2200, 4200, {
    styleTags: ["industrial", "mid-century", "luxury"],
    roomTags: ["living room", "office lobby"],
  }),
  item("om-armchair", "openmarket", "Upholstered accent chair", "furniture", 320, 780),
  item("nl-oak-table", "northline", "Solid oak dining table", "furniture", 900, 2100, {
    roomTags: ["dining room", "kitchen", "restaurant/cafe"],
  }),
  item("nl-bed-platform", "northline", "Platform bed frame", "furniture", 700, 1800, {
    roomTags: ["bedroom", "hotel room", "kids room"],
  }),
  item("a9-desk", "atelier-9", "Custom work desk", "furniture", 850, 2400, {
    roomTags: ["home office", "conference room"],
  }),
  item("om-shelving", "openmarket", "Modular shelving unit", "furniture", 260, 640),
  item("nl-conference-table", "northline", "Conference table, seats 8", "furniture", 1800, 4600, {
    roomTags: ["conference room", "office lobby"],
  }),
  item("om-patio-set", "openmarket", "Outdoor lounge set", "furniture", 700, 2200, {
    roomTags: ["backyard/patio"],
  }),

  // ---- Lighting ----------------------------------------------------------
  item("lc-pendant", "lumen-co", "Statement pendant light", "lighting", 220, 900, {
    roomTags: ["kitchen", "dining room", "restaurant/cafe", "office lobby"],
  }),
  item("lc-floor-lamp", "lumen-co", "Arc floor lamp", "lighting", 180, 520),
  item("lc-track", "lumen-co", "Track lighting run", "lighting", 260, 780, {
    styleTags: ["industrial", "modern-minimal", "cyberpunk"],
  }),
  item("lc-sconce", "lumen-co", "Wall sconce pair", "lighting", 140, 420),
  item("lc-led-strip", "lumen-co", "Concealed LED strip lighting", "lighting", 90, 320, {
    styleTags: ["cyberpunk", "modern-minimal", "luxury"],
  }),

  // ---- Textiles ----------------------------------------------------------
  item("om-rug-wool", "openmarket", "Hand-loomed wool rug", "textiles", 380, 1400),
  item("om-curtains", "openmarket", "Lined drapery panels", "textiles", 160, 560, { unit: "per window" }),
  item("om-bedding", "openmarket", "Bedding and throw set", "textiles", 140, 460, {
    roomTags: ["bedroom", "hotel room", "kids room"],
  }),
  item("om-cushions", "openmarket", "Cushion and throw set", "textiles", 90, 280),

  // ---- Decor -------------------------------------------------------------
  item("a9-art", "atelier-9", "Curated wall art", "decor", 180, 950, { unit: "per piece" }),
  item("om-planter", "openmarket", "Planter with mature plant", "decor", 70, 260),
  item("om-mirror", "openmarket", "Framed mirror", "decor", 120, 480),
  item("a9-styling", "atelier-9", "Shelf and surface styling", "decor", 150, 600),

  // ---- Surfaces (renovate only) -----------------------------------------
  item("bw-flooring", "brightwork", "Engineered oak flooring, supplied and laid", "surfaces", 9, 18, {
    renovateOnly: true,
    unit: "per sq ft",
  }),
  item("bw-tile", "brightwork", "Porcelain tile, supplied and laid", "surfaces", 11, 24, {
    renovateOnly: true,
    unit: "per sq ft",
    roomTags: ["bathroom", "kitchen", "restaurant/cafe"],
  }),
  item("bw-paint", "brightwork", "Full repaint, walls and trim", "surfaces", 700, 2400, {
    renovateOnly: true,
    unit: "per room",
  }),

  // ---- Fixtures (renovate only) -----------------------------------------
  item("bw-cabinetry", "brightwork", "Cabinetry, supplied and fitted", "fixtures", 3200, 11000, {
    renovateOnly: true,
    roomTags: ["kitchen", "bathroom", "home office"],
  }),
  item("bw-plumbing", "brightwork", "Sanitaryware and tapware set", "fixtures", 900, 3600, {
    renovateOnly: true,
    roomTags: ["bathroom", "kitchen"],
  }),
  item("bw-joinery", "brightwork", "Built-in joinery", "fixtures", 1800, 6500, {
    renovateOnly: true,
  }),

  // ---- Labor (renovate only) --------------------------------------------
  item("bw-labor", "brightwork", "Trade labor allowance", "labor", 2200, 7500, {
    renovateOnly: true,
    unit: "per room",
  }),
  item("a9-design-fee", "atelier-9", "Design and project coordination", "labor", 1200, 4500, {
    renovateOnly: true,
    unit: "per project",
  }),
];
