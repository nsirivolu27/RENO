import { randomUUID } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

/**
 * Freemium credits stub (hosted mode).
 *
 * Anonymous visitors are identified by an httpOnly cookie and get
 * FREE_CREDITS renders against the server's provider keys. BYO-key renders
 * never touch this module's balances.
 *
 * Production path (intentionally not built yet):
 * - Replace the in-memory Map with Supabase/Postgres `profiles.credits`.
 * - Add auth; on sign-up, merge the anonymous cookie's remaining credits
 *   into the new profile, then retire the cookie balance.
 * - A Stripe webhook (checkout.session.completed) increments
 *   `profiles.credits` for purchased packs ($9 / 30 renders).
 * - Keep spend-after-success semantics: only decrement once a provider
 *   generation actually returns an image.
 */

export const VISITOR_COOKIE = "reno_visitor";

function freeCredits(): number {
  const parsed = Number(process.env.FREE_CREDITS);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 3;
}

// Survives dev-server hot reloads; resets on process restart (fine for a stub).
const globalScope = globalThis as typeof globalThis & {
  __renoCredits?: Map<string, number>;
};
const balances: Map<string, number> = globalScope.__renoCredits ?? new Map();
globalScope.__renoCredits = balances;

export interface VisitorIdentity {
  id: string;
  isNew: boolean;
}

export function resolveVisitorId(req: NextRequest): VisitorIdentity {
  const existing = req.cookies.get(VISITOR_COOKIE)?.value;
  if (existing) {
    return { id: existing, isNew: false };
  }
  return { id: randomUUID(), isNew: true };
}

export function attachVisitorCookie(res: NextResponse, id: string): void {
  res.cookies.set(VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function getRemainingCredits(visitorId: string): number {
  return balances.get(visitorId) ?? freeCredits();
}

/** Spend one credit AFTER a successful generation. Returns the new balance. */
export function spendCredit(visitorId: string): number {
  const next = Math.max(0, getRemainingCredits(visitorId) - 1);
  balances.set(visitorId, next);
  return next;
}

/** Server-side provider key for hosted mode, if configured. */
export function serverKeyFor(providerId: string): string {
  switch (providerId) {
    case "gemini":
      return process.env.GEMINI_API_KEY ?? "";
    case "openai":
      return process.env.OPENAI_API_KEY ?? "";
    case "replicate":
      return process.env.REPLICATE_API_TOKEN ?? "";
    default:
      return "";
  }
}
