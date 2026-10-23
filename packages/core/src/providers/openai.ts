import { dataUrlParts } from "../types";
import type { GenerateRequest, GenerateResult, Provider } from "../types";

export const MODEL = "gpt-image-1";

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType });
}

interface OpenAIImageResponse {
  data?: Array<{ b64_json?: string }>;
}

export const openaiProvider: Provider = {
  id: "openai",
  name: "OpenAI",
  model: MODEL,
  async generate(req: GenerateRequest, prompt: string, apiKey: string): Promise<GenerateResult> {
    const { mimeType, base64 } = dataUrlParts(req.image);
    const form = new FormData();
    form.append("model", MODEL);
    form.append("prompt", prompt);
    form.append("size", "1024x1024");
    form.append("image", base64ToBlob(base64, mimeType), "room.png");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}` },
      body: form
    });

    if (!response.ok) {
      throw new Error(`OpenAI failed: ${response.status} ${await response.text()}`);
    }

    const json = (await response.json()) as OpenAIImageResponse;
    const image = json.data?.[0]?.b64_json;
    if (!image) {
      throw new Error("OpenAI did not return a base64 image.");
    }

    return { image: `data:image/png;base64,${image}`, provider: this.id, model: MODEL };
  }
};
