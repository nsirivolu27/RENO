import type { GenerateRequest, GenerateResult, Provider } from "../types";

export const MODEL = "black-forest-labs/flux-kontext-pro";

const ENDPOINT = `https://api.replicate.com/v1/models/${MODEL}/predictions`;
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 120_000;

interface ReplicatePrediction {
  status?: string;
  output?: unknown;
  error?: string | null;
  urls?: { get?: string };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

export const replicate: Provider = {
  id: "replicate",
  name: "Replicate (FLUX Kontext)",
  model: MODEL,

  async generate(
    req: GenerateRequest,
    prompt: string,
    apiKey: string
  ): Promise<GenerateResult> {
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    // "Prefer: wait" holds the connection until the prediction finishes
    // (or the sync window elapses, in which case we poll below).
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { ...headers, Prefer: "wait" },
      body: JSON.stringify({
        input: {
          prompt,
          input_image: req.image,
          output_format: "png",
        },
      }),
    });

    let prediction = (await res.json().catch(() => ({}))) as ReplicatePrediction;
    if (!res.ok) {
      throw new Error(
        `Replicate request failed (${res.status}): ${prediction.error ?? "unknown error"}`
      );
    }

    const deadline = Date.now() + POLL_TIMEOUT_MS;
    while (
      (prediction.status === "starting" || prediction.status === "processing") &&
      Date.now() < deadline
    ) {
      const pollUrl = prediction.urls?.get;
      if (!pollUrl) break;
      await sleep(POLL_INTERVAL_MS);
      const poll = await fetch(pollUrl, { headers });
      prediction = (await poll.json()) as ReplicatePrediction;
    }

    if (prediction.status !== "succeeded") {
      throw new Error(
        `Replicate prediction ${prediction.status ?? "failed"}: ${prediction.error ?? "no details"}`
      );
    }

    const output = Array.isArray(prediction.output)
      ? prediction.output[0]
      : prediction.output;
    if (typeof output !== "string") {
      throw new Error("Replicate returned no output image URL.");
    }

    const imageRes = await fetch(output);
    if (!imageRes.ok) {
      throw new Error(`Failed to download Replicate output (${imageRes.status}).`);
    }
    const contentType = imageRes.headers.get("content-type") ?? "image/png";
    const base64 = bytesToBase64(new Uint8Array(await imageRes.arrayBuffer()));

    return {
      image: `data:${contentType};base64,${base64}`,
      provider: "replicate",
      model: MODEL,
    };
  },
};
