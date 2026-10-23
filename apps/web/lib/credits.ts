import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

const COOKIE_NAME = "reno_visitor";
const balances = new Map<string, number>();

function freeCredits(): number {
  const parsed = Number.parseInt(process.env.FREE_CREDITS ?? "3", 10);
  return Number.isFinite(parsed) ? parsed : 3;
}

export async function getVisitorId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) {
    return existing;
  }

  const id = randomUUID();
  store.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
  balances.set(id, freeCredits());
  return id;
}

export async function getCredits(): Promise<number> {
  const id = await getVisitorId();
  if (!balances.has(id)) {
    balances.set(id, freeCredits());
  }
  return balances.get(id) ?? 0;
}

export async function spendCredit(): Promise<number> {
  const id = await getVisitorId();
  const current = await getCredits();
  if (current <= 0) {
    return 0;
  }
  const next = current - 1;
  balances.set(id, next);
  return next;
}

// Production upgrade path:
// Replace this in-memory Map with a Supabase/Postgres table keyed by authenticated user id.
// Keep anonymous cookie credits in a temporary table or signed cookie, add auth, and merge
// remaining anonymous credits into profiles.credits on signup. Stripe webhooks should
// increment profiles.credits after successful checkout or subscription renewal.
