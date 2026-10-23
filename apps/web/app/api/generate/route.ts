import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  buildPrompt,
  classifyProviderFailure,
  dataUrlParts,
  getProvider,
  providers,
} from "@reno/core";
import type { DesignBrief, GenerateMode, GenerateRequest } from "@reno/core";
import {
  attachVisitorCookie,
  getRemainingCredits,
  resolveVisitorId,
  serverKeyFor,
  spendCredit,
} from "@/lib/credits";

export const runtime = "nodejs";

/**
 * GET /api/generate
 * Returns the visitor's remaining hosted credits and provider availability.
 */
export async function GET(req: NextRequest) {
  const { id, isNew } = resolveVisitorId(req);
  const res = NextResponse.json({
    credits: getRemainingCredits(id),
    providers: providers.map((p) => ({
      id: p.id,
      name: p.name,
      model: p.model,
      configured: p.id === "demo" || Boolean(serverKeyFor(p.id)),
    })),
  });
  if (isNew) attachVisitorCookie(res, id);
  return res;
}

interface GenerateBody {
  image?: unknown;
  style?: unknown;
  room?: unknown;
  mode?: unknown;
  notes?: unknown;
  design?: unknown;
  provider?: unknown;
  apiKey?: unknown;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asDesignBrief(value: unknown): DesignBrief | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  const design: DesignBrief = {};
  for (const key of [
    "furniture",
    "lighting",
    "walls",
    "flooring",
    "fixtures",
    "mustKeep",
    "budget",
  ] as const) {
    const text = asString(raw[key]);
    if (text) design[key] = text.slice(0, 600);
  }
  return Object.keys(design).length > 0 ? design : undefined;
}

/**
 * POST /api/generate
 * Runs one image-to-image generation.
 * - BYO key in the request body → free, never touches hosted credits.
 * - Server env key → requires credits; a credit is spent ONLY after the
 *   provider generation succeeds.
 */
export async function POST(req: NextRequest) {
  const { id: visitorId, isNew } = resolveVisitorId(req);
  const respond = (status: number, body: Record<string, unknown>) => {
    const res = NextResponse.json(body, { status });
    if (isNew) attachVisitorCookie(res, visitorId);
    return res;
  };

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return respond(400, { error: "Request body must be JSON.", code: "INVALID_BODY" });
  }

  const image = typeof body.image === "string" ? body.image : "";
  try {
    dataUrlParts(image);
  } catch (err) {
    return respond(400, {
      error: err instanceof Error ? err.message : "Invalid image.",
      code: "INVALID_IMAGE",
    });
  }

  const style = asString(body.style);
  const room = asString(body.room);
  const mode: GenerateMode | "" =
    body.mode === "restyle" || body.mode === "renovate" ? body.mode : "";
  if (!style || !room || !mode) {
    return respond(400, {
      error: "style, room, and mode ('restyle' | 'renovate') are required.",
      code: "INVALID_REQUEST",
    });
  }

  const providerId = asString(body.provider) || process.env.DEFAULT_PROVIDER || "gemini";
  const provider = getProvider(providerId);
  if (!provider) {
    return respond(400, {
      error: `Unknown provider "${providerId}".`,
      code: "UNKNOWN_PROVIDER",
    });
  }

  const byoKey = asString(body.apiKey);
  const serverKey = serverKeyFor(provider.id);
  const apiKey = byoKey || serverKey;
  const usingDemoProvider = provider.id === "demo";
  if (!apiKey && !usingDemoProvider) {
    return respond(400, {
      error: `No API key available for ${provider.name}. Paste your own key in Studio, or configure the server.`,
      code: "NO_API_KEY",
    });
  }

  const usingServerKey = !byoKey && !usingDemoProvider;
  if (usingServerKey && getRemainingCredits(visitorId) <= 0) {
    return respond(402, {
      error:
        "You're out of free renders. Add your own API key for unlimited free renders, or buy a credit pack.",
      code: "NO_CREDITS",
      credits: 0,
    });
  }

  const notes = asString(body.notes);
  const design = asDesignBrief(body.design);
  const request: GenerateRequest = {
    image,
    style,
    room,
    mode,
    ...(notes ? { notes } : {}),
    ...(design ? { design } : {}),
  };
  const prompt = buildPrompt(request);

  try {
    const result = await provider.generate(request, prompt, apiKey || "demo");
    // Spend AFTER success only. BYO-key renders never spend hosted credits.
    const credits = usingServerKey
      ? spendCredit(visitorId)
      : getRemainingCredits(visitorId);
    return respond(200, { ...result, credits });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Generation failed.";
    const failure = classifyProviderFailure(provider.id, raw);
    return respond(502, {
      error: failure.message,
      code: "PROVIDER_ERROR",
      // Machine-readable reason so the UI can suggest the right recovery.
      reason: failure.kind,
      // Keep the provider's own words available for debugging.
      detail: raw,
      credits: getRemainingCredits(visitorId),
    });
  }
}
