import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { attachVisitorCookie, resolveVisitorId } from "@/lib/credits";

/**
 * A JSON responder bound to one visitor.
 *
 * Every project/share route needs the same two things: resolve the visitor
 * from the request, and attach the identity cookie to the response when the
 * visitor is new. Doing that inline in each route led to a `jsonWithVisitorCookie`
 * helper being copy-pasted into every file. This centralizes it.
 */
export interface Responder {
  visitorId: string;
  json(body: Record<string, unknown>, status?: number): NextResponse;
}

export function responderFor(req: NextRequest): Responder {
  const { id, isNew } = resolveVisitorId(req);
  return {
    visitorId: id,
    json(body, status = 200) {
      const res = NextResponse.json(body, { status });
      if (isNew) attachVisitorCookie(res, id);
      return res;
    },
  };
}

interface StoreErrorInfo {
  status: number;
  message: string;
}

/**
 * Canonical mapping of the error codes thrown by the project store to an HTTP
 * status and a user-facing message. Kept in one place so routes don't each
 * re-map the same codes (and can't drift out of sync).
 *
 * Statuses/messages intentionally match the previous per-route behavior so
 * this refactor is response-compatible.
 */
const STORE_ERRORS: Record<string, StoreErrorInfo> = {
  PROJECT_NOT_FOUND: { status: 404, message: "Project not found." },
  RENDER_NOT_FOUND: { status: 404, message: "Render not found." },
  PROJECT_LIMIT_REACHED: {
    status: 400,
    message: "Project limit reached for this visitor.",
  },
  RENDER_LIMIT_REACHED: {
    status: 400,
    message: "Render limit reached for this project.",
  },
  INVALID_IMAGE: {
    status: 400,
    message: "beforeImage and afterImage must be valid data URLs.",
  },
  INVALID_PROJECT: {
    status: 400,
    message: "This file does not look like a Reno project export.",
  },
  INVALID_BODY: { status: 400, message: "Request body must be JSON." },
  COMPANY_NOT_FOUND: { status: 404, message: "Company not found." },
  COMPANY_LIMIT_REACHED: {
    status: 400,
    message: "Company limit reached for this visitor.",
  },
  OFFERING_NOT_FOUND: { status: 404, message: "Offering not found." },
  OFFERING_LIMIT_REACHED: {
    status: 400,
    message: "Offering limit reached for this company.",
  },
  LEAD_NOT_FOUND: { status: 404, message: "Lead not found." },
  LEAD_LIMIT_REACHED: {
    status: 400,
    message: "Lead limit reached for this company.",
  },
};

export interface ErrorEnvelope {
  status: number;
  body: { error: string; code: string };
}

/**
 * Turns a thrown store error into `{ status, body }`. If the error message is a
 * known store code it is used directly; otherwise `fallbackCode` is applied
 * (which may itself be a known code, e.g. "INVALID_PROJECT" for the import
 * route, or an unknown one which yields a generic 400).
 */
export function storeError(err: unknown, fallbackCode = "REQUEST_FAILED"): ErrorEnvelope {
  const raw = err instanceof Error ? err.message : "";
  const code = raw in STORE_ERRORS ? raw : fallbackCode;
  const info = STORE_ERRORS[code] ?? { status: 400, message: "Request failed." };
  return { status: info.status, body: { error: info.message, code } };
}

/** Convenience: build the standard INVALID_BODY envelope. */
export function invalidBody(): ErrorEnvelope {
  return { status: 400, body: { error: STORE_ERRORS.INVALID_BODY.message, code: "INVALID_BODY" } };
}
