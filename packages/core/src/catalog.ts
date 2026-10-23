import type { GenerateMode } from "./types";

/**
 * Priced catalog + cost estimation.
 *
 * A render is only half of what a client wants — the other half is "what would
 * this cost, and who supplies it". This module maps a concept (room + style +
 * mode) onto catalog items from real vendors and produces an itemized range.
 *
 * Estimation is deterministic: the same concept and catalog always produce the
 * same estimate, so a proposal you print today matches the one you emailed
 * yesterday.
 */

export type ItemCategory =
  | "furniture"
  | "lighting"
  | "textiles"
  | "decor"
  | "surfaces"
  | "fixtures"
  | "labor";

export const ITEM_CATEGORIES: ItemCategory[] = [
  "furniture",
  "lighting",
  "textiles",
  "decor",
  "surfaces",
  "fixtures",
  "labor",
];

export type VendorKind =
  | "furniture_store"
  | "design_studio"
  | "renovation_contractor"
  | "marketplace";

export interface Vendor {
  id: string;
  name: string;
  kind: VendorKind;
  /** Free-form service area, e.g. "Dallas–Fort Worth" or "Nationwide". */
  region?: string;
  url?: string;
}

export interface CatalogItem {
  id: string;
  vendorId: string;
  name: string;
  category: ItemCategory;
  /** Typical low/high price in whole currency units (not cents). */
  priceLow: number;
  priceHigh: number;
  /** ISO 4217, e.g. "USD". */
  currency: string;
  /** Style ids this suits. Empty means it works with any style. */
  styleTags: string[];
  /** Room names this suits. Empty means any room. */
  roomTags: string[];
  /** Surfaces, fixtures and labor only apply to renovate-mode concepts. */
  renovateOnly?: boolean;
  /** "each", "per sq ft", "per room" — shown in the proposal. */
  unit?: string;
  url?: string;
}

/** Budget position within the available catalog for a category. */
export type BudgetTier = "essential" | "standard" | "premium";

export const BUDGET_TIERS: BudgetTier[] = ["essential", "standard", "premium"];

export interface EstimateLine {
  itemId: string;
  name: string;
  category: ItemCategory;
  vendorId: string;
  vendorName: string;
  quantity: number;
  unit: string;
  /** quantity × item price. */
  low: number;
  high: number;
  url?: string;
}

export interface CostEstimate {
  currency: string;
  room: string;
  style: string;
  mode: GenerateMode;
  tier: BudgetTier;
  lines: EstimateLine[];
  subtotalLow: number;
  subtotalHigh: number;
  /** Caveats that must be shown with any number we display. */
  notes: string[];
}

export interface EstimateInput {
  room: string;
  style: string;
  mode: GenerateMode;
  tier?: BudgetTier;
  catalog: CatalogItem[];
  vendors: Vendor[];
  /** Restrict to these vendors (e.g. a company's own product line). */
  vendorIds?: string[];
}

/**
 * How many of each category a room typically needs. Deliberately conservative:
 * an estimate that is too low destroys trust with a client.
 */
const BASE_QUANTITIES: Record<ItemCategory, number> = {
  furniture: 3,
  lighting: 2,
  textiles: 2,
  decor: 3,
  surfaces: 1,
  fixtures: 1,
  labor: 1,
};

/** Rooms that need more or less of a category than the base. */
const ROOM_ADJUSTMENTS: Record<string, Partial<Record<ItemCategory, number>>> = {
  "living room": { furniture: 4, decor: 4 },
  bedroom: { furniture: 3, textiles: 3 },
  kitchen: { furniture: 2, fixtures: 2, surfaces: 2 },
  bathroom: { furniture: 1, fixtures: 2, decor: 1 },
  "dining room": { furniture: 2, lighting: 1 },
  "home office": { furniture: 3, lighting: 2 },
  "kids room": { furniture: 3, decor: 4 },
  "backyard/patio": { furniture: 3, lighting: 3, textiles: 1, surfaces: 2 },
  garage: { furniture: 2, lighting: 2, decor: 0, textiles: 0 },
  basement: { furniture: 3, lighting: 3 },
  "office lobby": { furniture: 4, lighting: 3, decor: 3, surfaces: 2 },
  "conference room": { furniture: 2, lighting: 2, decor: 2 },
  "retail space": { furniture: 4, lighting: 4, surfaces: 2, decor: 3 },
  "restaurant/cafe": { furniture: 6, lighting: 4, textiles: 2, surfaces: 2 },
  "hotel room": { furniture: 4, textiles: 3, lighting: 2 },
};

/**
 * Typical finished area per space, used for anything priced per square foot.
 * Without this, a "per sq ft" floor would be multiplied by a category count and
 * come out absurdly cheap.
 */
export const ROOM_AREA_SQFT: Record<string, number> = {
  "living room": 320,
  bedroom: 200,
  kitchen: 180,
  bathroom: 60,
  "dining room": 180,
  "home office": 140,
  "kids room": 150,
  "backyard/patio": 300,
  garage: 400,
  basement: 500,
  "office lobby": 600,
  "conference room": 300,
  "retail space": 1200,
  "restaurant/cafe": 1500,
  "hotel room": 300,
};

const DEFAULT_AREA_SQFT = 250;

export function areaFor(room: string): number {
  return ROOM_AREA_SQFT[room] ?? DEFAULT_AREA_SQFT;
}

function quantityFor(item: CatalogItem, room: string): number {
  // Area-priced items scale with the room, not with a category count.
  if (item.unit === "per sq ft") return areaFor(room);
  const adjusted = ROOM_ADJUSTMENTS[room]?.[item.category];
  return adjusted ?? BASE_QUANTITIES[item.category];
}

/** True when this category is worth including for the room at all. */
function categoryApplies(category: ItemCategory, room: string): boolean {
  const adjusted = ROOM_ADJUSTMENTS[room]?.[category];
  return (adjusted ?? BASE_QUANTITIES[category]) > 0;
}

function midPrice(item: CatalogItem): number {
  return (item.priceLow + item.priceHigh) / 2;
}

/**
 * Picks one item per category for the requested tier.
 * Candidates are sorted by mid price; essential takes the cheapest, premium the
 * dearest, standard the median. Ties break on id so results stay stable.
 */
function pickForTier(
  candidates: CatalogItem[],
  tier: BudgetTier
): CatalogItem | undefined {
  if (candidates.length === 0) return undefined;
  const sorted = [...candidates].sort(
    (a, b) => midPrice(a) - midPrice(b) || a.id.localeCompare(b.id)
  );
  if (tier === "essential") return sorted[0];
  if (tier === "premium") return sorted[sorted.length - 1];
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

function matches(item: CatalogItem, style: string, room: string): boolean {
  const styleOk = item.styleTags.length === 0 || item.styleTags.includes(style);
  const roomOk = item.roomTags.length === 0 || item.roomTags.includes(room);
  return styleOk && roomOk;
}

function round(value: number): number {
  return Math.round(value);
}

/**
 * Builds an itemized cost range for one concept.
 * Restyle mode excludes surfaces, fixtures and labor, matching the prompt
 * contract that restyle leaves built surfaces alone.
 */
export function estimateForConcept(input: EstimateInput): CostEstimate {
  const { room, style, mode, catalog, vendors } = input;
  const tier: BudgetTier = input.tier ?? "standard";
  const vendorNames = new Map(vendors.map((v) => [v.id, v.name]));

  const usable = catalog.filter((item) => {
    if (input.vendorIds && !input.vendorIds.includes(item.vendorId)) return false;
    if (mode === "restyle" && item.renovateOnly) return false;
    return matches(item, style, room);
  });

  const currency = usable[0]?.currency ?? "USD";
  const lines: EstimateLine[] = [];

  for (const category of ITEM_CATEGORIES) {
    if (!categoryApplies(category, room)) continue;
    const picked = pickForTier(
      usable.filter((item) => item.category === category),
      tier
    );
    if (!picked) continue;
    const quantity = quantityFor(picked, room);
    if (quantity <= 0) continue;
    lines.push({
      itemId: picked.id,
      name: picked.name,
      category,
      vendorId: picked.vendorId,
      vendorName: vendorNames.get(picked.vendorId) ?? picked.vendorId,
      quantity,
      unit: picked.unit ?? "each",
      low: round(picked.priceLow * quantity),
      high: round(picked.priceHigh * quantity),
      ...(picked.url ? { url: picked.url } : {}),
    });
  }

  const subtotalLow = round(lines.reduce((sum, line) => sum + line.low, 0));
  const subtotalHigh = round(lines.reduce((sum, line) => sum + line.high, 0));

  const notes = [
    "Indicative range from catalog pricing, not a quote.",
    mode === "restyle"
      ? "Furnishings and decor only. No construction, surfaces or fixtures."
      : "Includes surfaces, fixtures and an allowance for labor.",
    "Final pricing depends on site conditions, measurements and vendor availability.",
  ];

  return {
    currency,
    room,
    style,
    mode,
    tier,
    lines,
    subtotalLow,
    subtotalHigh,
    notes,
  };
}

/** Formats a low–high range for display, e.g. "$4,200 – $6,800". */
export function formatMoneyRange(
  low: number,
  high: number,
  currency = "USD"
): string {
  const format = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  return low === high ? format(low) : `${format(low)} – ${format(high)}`;
}

/** Groups a catalog by vendor for browsing UIs. */
export function itemsByVendor(
  catalog: CatalogItem[]
): Map<string, CatalogItem[]> {
  const grouped = new Map<string, CatalogItem[]>();
  for (const item of catalog) {
    const list = grouped.get(item.vendorId) ?? [];
    list.push(item);
    grouped.set(item.vendorId, list);
  }
  return grouped;
}
