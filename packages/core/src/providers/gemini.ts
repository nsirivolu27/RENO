import { dataUrlParts } from "../types";
import type { GenerateRequest, GenerateResult, Provider } from "../types";

export const MODEL = "gemini-2.5-flash-image";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: { mimeType: string; data: string };
        text?: string;
      }>;
    };
  }>;
}

export const geminiProvider: Provider = {
  id: "gemini",
  name: "Gemini",
  model: MODEL,
  async generate(req: GenerateRequest, prompt: string, apiKey: string): Promise<GenerateResult> {
    const { mimeType, base64 } = dataUrlParts(req.image);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ inlineData: { mimeType, data: base64 } }, { text: prompt }]
          }
        ],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini failed: ${response.status} ${await response.text()}`);
    }

    const json = (await response.json()) as GeminiResponse;
    const image = json.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;
    if (!image) {
      throw new Error("Gemini did not return an image.");
    }

    return { image: `data:${image.mimeType};base64,${image.data}`, provider: this.id, model: MODEL };
  }
};
