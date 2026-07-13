import type { GenerateRequest, GenerateResult, Provider } from "../types";

export const MODEL = "black-forest-labs/flux-kontext-pro";

interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string;
  urls?: { get?: string };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

async function predictionToImage(prediction: ReplicatePrediction): Promise<string> {
  const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (!output) {
    throw new Error("Replicate did not return an output URL.");
  }

  const imageResponse = await fetch(output);
  if (!imageResponse.ok) {
    throw new Error(`Could not fetch Replicate output: ${imageResponse.status}`);
  }

  const mimeType = imageResponse.headers.get("content-type") ?? "image/png";
  const bytes = new Uint8Array(await imageResponse.arrayBuffer());
  return `data:${mimeType};base64,${bytesToBase64(bytes)}`;
}

export const replicateProvider: Provider = {
  id: "replicate",
  name: "Replicate",
  model: MODEL,
  async generate(req: GenerateRequest, prompt: string, apiKey: string): Promise<GenerateResult> {
    const response = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        Prefer: "wait"
      },
      body: JSON.stringify({ input: { prompt, input_image: req.image } })
    });

    if (!response.ok) {
      throw new Error(`Replicate failed: ${response.status} ${await response.text()}`);
    }

    let prediction = (await response.json()) as ReplicatePrediction;
    while ((prediction.status === "starting" || prediction.status === "processing") && prediction.urls?.get) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const pollResponse = await fetch(prediction.urls.get, {
        headers: { authorization: `Bearer ${apiKey}` }
      });
      if (!pollResponse.ok) {
        throw new Error(`Replicate polling failed: ${pollResponse.status}`);
      }
      prediction = (await pollResponse.json()) as ReplicatePrediction;
    }

    if (prediction.status !== "succeeded") {
      throw new Error(prediction.error ?? `Replicate ended with ${prediction.status}.`);
    }

    return { image: await predictionToImage(prediction), provider: this.id, model: MODEL };
  }
};
