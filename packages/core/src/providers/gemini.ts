import type { GenerateRequest, GenerateResult, Provider } from "../types";
import { dataUrlParts } from "../types";

export const MODEL = "gemini-2.5-flash-image";

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

interface GeminiInlineData {
  mimeType?: string;
  data?: string;
}

interface GeminiPart {
  inlineData?: GeminiInlineData;
  text?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
  }>;
  error?: { message?: string };
}

export const gemini: Provider = {
  id: "gemini",
  name: "Google Gemini",
  model: MODEL,

  async generate(
    req: GenerateRequest,
    prompt: string,
    apiKey: string
  ): Promise<GenerateResult> {
    const { mimeType, base64 } = dataUrlParts(req.image);

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inlineData: { mimeType, data: base64 } },
              { text: prompt },
            ],
          },
        ],
      }),
    });

    const json = (await res.json().catch(() => ({}))) as GeminiResponse;
    if (!res.ok) {
      throw new Error(
        `Gemini request failed (${res.status}): ${json.error?.message ?? "unknown error"}`
      );
    }

    const parts = json.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      const data = part.inlineData?.data;
      if (data) {
        const outMime = part.inlineData?.mimeType ?? "image/png";
        return {
          image: `data:${outMime};base64,${data}`,
          provider: "gemini",
          model: MODEL,
        };
      }
    }

    throw new Error("Gemini returned no image. Try a different photo or prompt.");
  },
};
