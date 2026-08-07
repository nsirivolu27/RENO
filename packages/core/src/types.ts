/** How aggressively a generation may change the space. */
export type GenerateMode = "restyle" | "renovate";

/** A single image-to-image generation request. */
export interface GenerateRequest {
  /** Base64 data URL of the source photo. */
  image: string;
  /** Style preset id (see styles.ts) or a free-form style name. */
  style: string;
  /** Room / space type, e.g. "living room". */
  room: string;
  mode: GenerateMode;
  /** Optional extra design direction appended to the prompt. */
  notes?: string;
}

/** The result of a successful generation. */
export interface GenerateResult {
  /** Base64 data URL of the generated image. */
  image: string;
  provider: string;
  model: string;
}

/** A pluggable image-generation provider. */
export interface Provider {
  id: string;
  name: string;
  model: string;
  generate(
    req: GenerateRequest,
    prompt: string,
    apiKey: string
  ): Promise<GenerateResult>;
}

export interface DataUrlParts {
  mimeType: string;
  base64: string;
}

// svg+xml is accepted because the built-in Demo provider returns an SVG concept
// board as a data URL. SVGs are only ever rendered inside <img>, which does not
// execute embedded scripts, so this is safe for our display/storage use.
const DATA_URL_RE =
  /^data:(image\/(?:png|jpe?g|webp|heic|heif|svg\+xml));base64,([A-Za-z0-9+/]+={0,2})$/;

/**
 * Validates a base64 image data URL and splits it into its parts.
 * Throws a descriptive error for anything that is not a base64 image.
 */
export function dataUrlParts(dataUrl: string): DataUrlParts {
  const match = DATA_URL_RE.exec(dataUrl);
  const mimeType = match?.[1];
  const base64 = match?.[2];
  if (!mimeType || !base64) {
    throw new Error(
      "Expected a base64 image data URL (data:image/png;base64,... or similar)."
    );
  }
  return { mimeType, base64 };
}
