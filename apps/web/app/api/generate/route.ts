import { buildPrompt, dataUrlParts } from "@openreno/core";
import type { GenerateMode, GenerateRequest } from "@openreno/core";
import { getProvider, providers } from "@openreno/core/providers";
import { getCredits, spendCredit } from "../../../lib/credits";
import { NextResponse } from "next/server";

type GenerateBody = Partial<GenerateRequest> & {
  provider?: string;
  apiKey?: string;
};

const envKeys: Record<string, string | undefined> = {
  gemini: process.env.GEMINI_API_KEY,
  openai: process.env.OPENAI_API_KEY,
  replicate: process.env.REPLICATE_API_TOKEN
};

function isMode(value: unknown): value is GenerateMode {
  return value === "restyle" || value === "renovate";
}

function validateBody(body: GenerateBody): GenerateRequest {
  if (!body.image || typeof body.image !== "string") {
    throw new Error("Missing image data URL.");
  }
  dataUrlParts(body.image);
  if (!body.style || typeof body.style !== "string") {
    throw new Error("Missing style.");
  }
  if (!body.room || typeof body.room !== "string") {
    throw new Error("Missing room.");
  }
  if (!isMode(body.mode)) {
    throw new Error("Mode must be restyle or renovate.");
  }

  return {
    image: body.image,
    style: body.style,
    room: body.room,
    mode: body.mode,
    notes: typeof body.notes === "string" ? body.notes : undefined
  };
}

export async function GET() {
  return NextResponse.json({
    credits: await getCredits(),
    providers: providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      model: provider.model,
      configured: Boolean(envKeys[provider.id])
    }))
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateBody;
    const req = validateBody(body);
    const providerId = body.provider || process.env.DEFAULT_PROVIDER || "gemini";
    const provider = getProvider(providerId);
    const byoKey = typeof body.apiKey === "string" && body.apiKey.trim() ? body.apiKey.trim() : "";
    const apiKey = byoKey || envKeys[provider.id];

    if (!apiKey) {
      return NextResponse.json({ error: "No API key configured for this provider.", code: "NO_API_KEY" }, { status: 400 });
    }

    if (!byoKey) {
      const current = await getCredits();
      if (current <= 0) {
        return NextResponse.json({ error: "No free credits remaining.", code: "NO_CREDITS" }, { status: 402 });
      }
    }

    const result = await provider.generate(req, buildPrompt(req), apiKey);
    const credits = byoKey ? await getCredits() : await spendCredit();
    return NextResponse.json({ result, credits, free: Boolean(byoKey) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed." },
      { status: 500 }
    );
  }
}
