import type { NextRequest } from "next/server";

/**
 * Request-body validation helpers shared by the project/share routes.
 *
 * The heavy normalization (trimming, known-room/known-style filtering, data-URL
 * validation) lives in `serverProjects.ts` next to the store. These helpers
 * cover the thin, repeated route-level checks — parsing JSON and reading a
 * couple of typed fields — so routes stop doing ad-hoc `try/catch` + casts.
 */

/**
 * Parses the request body as a JSON object. Returns `null` for invalid JSON,
 * or for a JSON value that is not a plain object (arrays, strings, numbers,
 * null). Routes translate `null` into an INVALID_BODY response.
 */
export async function readJsonObject(
  req: NextRequest
): Promise<Record<string, unknown> | null> {
  try {
    const parsed: unknown = await req.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Reads an optional boolean `favorite` flag. Returns `undefined` when absent or
 * non-boolean, which the store treats as "toggle".
 */
export function readFavorite(body: Record<string, unknown>): boolean | undefined {
  return typeof body.favorite === "boolean" ? body.favorite : undefined;
}
