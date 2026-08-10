import type { Brief, ConceptGenerateInput } from "@workspace/api-zod";
import { logger } from "./logger";

interface DataUrlParts {
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  base64: string;
}

export type RenderErrorCode =
  | "INVALID_SOURCE_IMAGE"
  | "SOURCE_IMAGE_TOO_LARGE"
  | "PROVIDER_NOT_CONFIGURED"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_RATE_LIMITED"
  | "PROVIDER_REJECTED"
  | "PROVIDER_NO_IMAGE"
  | "PROVIDER_ERROR";

export interface RenovationRenderResult {
  success: boolean;
  resultImageUrl: string | null;
  provider: "gemini" | "openai" | "none";
  model: string | null;
  isDemo: false;
  renderId: string;
  errorCode?: RenderErrorCode;
  message?: string;
}

const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const DATA_URL_RE =
  /^data:(image\/(?:png|jpe?g|webp));base64,([A-Za-z0-9+/]+={0,2})$/i;

function dataUrlParts(value: string): DataUrlParts | null {
  const match = DATA_URL_RE.exec(value);
  if (!match?.[1] || !match?.[2]) return null;
  const mimeType = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
  return {
    mimeType: mimeType as DataUrlParts["mimeType"],
    base64: match[2],
  };
}

function briefLine(label: string, value: string): string | null {
  const text = value.trim();
  return text ? `${label}: ${text}` : null;
}

function buildBrief(brief: Brief): string {
  return [
    briefLine("Furniture and layout", brief.furnitureLayout),
    briefLine("Lighting plan", brief.lighting),
    briefLine("Paint, walls, and treatments", brief.walls),
    briefLine("Flooring and rugs", brief.flooring),
    briefLine("Fixtures, cabinetry, and built-ins", brief.fixtures),
    briefLine("Budget direction", brief.budget),
    briefLine("Must keep unchanged", brief.mustKeep),
  ]
    .filter(Boolean)
    .join(". ");
}

export function buildPhotorealRenovationPrompt(input: ConceptGenerateInput): string {
  const scope =
    input.mode === "restyle"
      ? "Restyle mode: change furniture, decor, rugs, art, textiles, and decorative lighting. Preserve existing floors, walls, cabinetry, fixtures, built-ins, windows, doors, room dimensions, and camera angle."
      : "Renovate mode: change furniture, decor, rugs, art, textiles, lighting, flooring, wall finishes, fixtures, cabinetry, built-ins, hardware, and finish materials while preserving the room dimensions, window and door positions, and camera angle.";
  const brief = buildBrief(input.brief);

  return [
    `Edit the provided room photograph into a photorealistic finished interior for this ${input.roomType}.`,
    `Design style: ${input.style}.`,
    scope,
    brief ? `Client design brief: ${brief}.` : "",
    "This is an image edit, not a new room: preserve the exact camera position, lens perspective, room dimensions, ceiling height, structural openings, windows, doors, and architecture from the source.",
    "Only make the requested design changes. Keep all must-keep items unchanged and keep realistic scale, circulation, materials, shadows, reflections, and natural real-estate photography lighting.",
    "The result must look like a real finished interior photograph, never a rendering, illustration, moodboard, CGI, collage, or concept sketch.",
    "No people, text, captions, logos, labels, watermarks, or before/after graphics.",
  ]
    .filter(Boolean)
    .join(" ");
}

function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("provider timeout")), ms);
    }),
  ]);
}

function safeProviderError(error: unknown): {
  code: RenderErrorCode;
  message: string;
} {
  const text = error instanceof Error ? error.message.toLowerCase() : "";
  if (text.includes("timeout")) {
    return {
      code: "PROVIDER_TIMEOUT",
      message: "The image provider took too long to respond. Try again with a smaller photo.",
    };
  }
  if (text.includes("429") || text.includes("rate") || text.includes("quota")) {
    return {
      code: "PROVIDER_RATE_LIMITED",
      message: "The image provider is busy or out of credits. Wait a moment and try again.",
    };
  }
  if (text.includes("safety") || text.includes("blocked") || text.includes("400")) {
    return {
      code: "PROVIDER_REJECTED",
      message: "The provider rejected this image or brief. Try a different room photo or simpler brief.",
    };
  }
  return {
    code: "PROVIDER_ERROR",
    message: "The photoreal renderer could not complete this request. Try again.",
  };
}

async function renderWithGemini(
  input: ConceptGenerateInput,
  prompt: string,
): Promise<{ image: string; model: string }> {
  const source = dataUrlParts(input.renderSourceImageUrl || input.sourceImageUrl);
  if (!source) {
    throw new Error("invalid source image");
  }

  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  const { editImage } = await import("@workspace/integrations-gemini-ai/image");
  const output = await timeout(
    editImage({
      prompt,
      mimeType: source.mimeType,
      base64: source.base64,
      model,
    }),
    120_000,
  );
  const outputData = dataUrlParts(`data:${output.mimeType};base64,${output.b64_json}`);
  if (!outputData) {
    throw new Error("invalid provider image");
  }
  return {
    image: `data:${outputData.mimeType};base64,${outputData.base64}`,
    model: output.model,
  };
}

export function validateRenderInput(input: ConceptGenerateInput): RenderErrorCode | null {
  const original = dataUrlParts(input.sourceImageUrl);
  if (!original) return "INVALID_SOURCE_IMAGE";
  const renderSource = input.renderSourceImageUrl
    ? dataUrlParts(input.renderSourceImageUrl)
    : original;
  if (!renderSource) {
    return "INVALID_SOURCE_IMAGE";
  }
  if (Buffer.byteLength(renderSource.base64, "base64") > MAX_SOURCE_BYTES) {
    return "SOURCE_IMAGE_TOO_LARGE";
  }
  return null;
}

export async function renderRenovationAfterImage(
  input: ConceptGenerateInput,
): Promise<RenovationRenderResult> {
  const renderId = `render_${crypto.randomUUID()}`;
  const validationError = validateRenderInput(input);
  if (validationError) {
    return {
      success: false,
      resultImageUrl: null,
      provider: "none",
      model: null,
      isDemo: false,
      renderId,
      errorCode: validationError,
      message:
        validationError === "SOURCE_IMAGE_TOO_LARGE"
          ? "This photo is too large. Choose an image under 8 MB."
          : "Upload a PNG, JPEG, or WebP room photo before generating.",
    };
  }

  const provider = (process.env.RENO_RENDER_PROVIDER || "gemini").toLowerCase();
  if (provider !== "auto" && provider !== "gemini") {
    return {
      success: false,
      resultImageUrl: null,
      provider: "none",
      model: null,
      isDemo: false,
      renderId,
      errorCode: "PROVIDER_NOT_CONFIGURED",
      message: "Gemini is the configured photoreal renderer for this workspace.",
    };
  }

  try {
    const rendered = await renderWithGemini(input, buildPhotorealRenovationPrompt(input));
    return {
      success: true,
      resultImageUrl: rendered.image,
      provider: "gemini",
      model: rendered.model,
      isDemo: false,
      renderId,
    };
  } catch (error) {
    const safe = safeProviderError(error);
    logger.warn({ provider: "gemini", code: safe.code }, "Photoreal render failed");
    return {
      success: false,
      resultImageUrl: null,
      provider: "gemini",
      model: process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image",
      isDemo: false,
      renderId,
      errorCode: safe.code,
      message: safe.message,
    };
  }
}