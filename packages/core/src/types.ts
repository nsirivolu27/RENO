export type GenerateMode = "restyle" | "renovate";

export interface GenerateRequest {
  image: string;
  style: string;
  room: string;
  mode: GenerateMode;
  notes?: string;
}

export interface GenerateResult {
  image: string;
  provider: string;
  model: string;
}

export interface Provider {
  id: string;
  name: string;
  model: string;
  generate(req: GenerateRequest, prompt: string, apiKey: string): Promise<GenerateResult>;
}

export function dataUrlParts(dataUrl: string): { mimeType: string; base64: string } {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Expected a base64 data URL.");
  }

  return { mimeType: match[1], base64: match[2].replace(/\s/g, "") };
}
