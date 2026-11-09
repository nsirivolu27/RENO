import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { BUDGET_TIERS, estimateForConcept } from "@reno/core";
import type { BudgetTier, GenerateMode } from "@reno/core";
import { getCatalogRepository } from "@/lib/catalogStore";
import { readJsonObject } from "@/lib/projectSchema";

export const runtime = "nodejs";

const repo = getCatalogRepository();

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * POST /api/estimate
 * Itemized cost range for one concept: { room, style, mode, tier?, vendorIds? }
 *
 * Estimates are indicative catalog pricing, never a quote — the response
 * carries the caveats that must be displayed alongside any number.
 */
export async function POST(req: NextRequest) {
  const body = await readJsonObject(req);
  if (!body) {
    return NextResponse.json(
      { error: "Request body must be JSON.", code: "INVALID_BODY" },
      { status: 400 }
    );
  }

  const room = asString(body.room);
  const style = asString(body.style);
  const mode: GenerateMode | "" =
    body.mode === "restyle" || body.mode === "renovate" ? body.mode : "";
  if (!room || !style || !mode) {
    return NextResponse.json(
      {
        error: "room, style, and mode ('restyle' | 'renovate') are required.",
        code: "INVALID_REQUEST",
      },
      { status: 400 }
    );
  }

  const rawTier = asString(body.tier);
  const tier = BUDGET_TIERS.includes(rawTier as BudgetTier)
    ? (rawTier as BudgetTier)
    : "standard";
  const vendorIds = Array.isArray(body.vendorIds)
    ? body.vendorIds.filter((id): id is string => typeof id === "string")
    : undefined;

  const snapshot = await repo.load();
  const estimate = estimateForConcept({
    room,
    style,
    mode,
    tier,
    catalog: snapshot.items,
    vendors: snapshot.vendors,
    ...(vendorIds && vendorIds.length > 0 ? { vendorIds } : {}),
  });

  return NextResponse.json({ estimate, catalogSource: snapshot.source });
}
