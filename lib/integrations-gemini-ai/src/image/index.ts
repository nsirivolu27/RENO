import { Modality } from "@google/genai";
import { ai } from "../client";

export interface ImageEditInput {
  prompt: string;
  mimeType: string;
  base64: string;
  model?: string;
}

export interface ImageEditResult {
  b64_json: string;
  mimeType: string;
  model: string;
}

export async function editImage(input: ImageEditInput): Promise<ImageEditResult> {
  const model = input.model || "gemini-2.5-flash-image";
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: input.mimeType, data: input.base64 } },
          { text: input.prompt },
        ],
      },
    ],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.data,
  );
  if (!imagePart?.inlineData?.data) {
    throw new Error("Gemini returned no edited image");
  }

  return {
    b64_json: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType || "image/png",
    model,
  };
}