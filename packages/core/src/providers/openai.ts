import type { GenerateRequest, GenerateResult, Provider } from "../types";
import { dataUrlParts } from "../types";

export const MODEL = "gpt-image-1";

const ENDPOINT = "https://api.openai.com/v1/images/edits";

interface OpenAIImageResponse {
  data?: Array<{ b64_json?: string }>;
  error?: { message?: string };
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export const openai: Provider = {
  id: "openai",
  name: "OpenAI",
  model: MODEL,

  async generate(
    req: GenerateRequest,
    prompt: string,
    apiKey: string
  ): Promise<GenerateResult> {
    const { mimeType, base64 } = dataUrlParts(req.image);
    const bytes = base64ToBytes(base64);
    const ext = mimeType === "image/jpeg" ? "jpg" : (mimeType.split("/")[1] ?? "png");

    const form = new FormData();
    form.append("image", new Blob([bytes], { type: mimeType }), `input.${ext}`);
    form.append("prompt", prompt);
    form.append("model", MODEL);
    form.append("size", "auto");

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    const json = (await res.json().catch(() => ({}))) as OpenAIImageResponse;
    if (!res.ok) {
      throw new Error(
        `OpenAI request failed (${res.status}): ${json.error?.message ?? "unknown error"}`
      );
    }

    const b64 = json.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error("OpenAI returned no image. Try a different photo or prompt.");
    }

    return {
      image: `data:image/png;base64,${b64}`,
      provider: "openai",
      model: MODEL,
    };
  },
};
