import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { ItemCategory } from "@reno/core";
import { ITEM_CATEGORIES } from "@reno/core";
import { getCatalogRepository } from "@/lib/catalogStore";

export const runtime = "nodejs";

const repo = getCatalogRepository();

/**
 * GET /api/catalog
 * Browse vendor pricing. Filters: style, room, category, vendorId,
 * furnishingsOnly=true (drops surfaces/fixtures/labor).
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const rawCategory = params.get("category");
  const category =
    rawCategory && ITEM_CATEGORIES.includes(rawCategory as ItemCategory)
      ? (rawCategory as ItemCategory)
      : undefined;

  const snapshot = await repo.query({
    style: params.get("style") ?? undefined,
    room: params.get("room") ?? undefined,
    vendorId: params.get("vendorId") ?? undefined,
    furnishingsOnly: params.get("furnishingsOnly") === "true",
    ...(category ? { category } : {}),
  });

  return NextResponse.json({
    source: snapshot.source,
    vendors: snapshot.vendors,
    items: snapshot.items,
    count: snapshot.items.length,
  });
}
