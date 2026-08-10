import type { Brief, ConceptGenerateInput } from "@workspace/api-zod";

interface DataUrlParts {
  mimeType: string;
  base64: string;
}

const DATA_URL_RE = /^data:(image\/(?:png|jpe?g|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

function dataUrlParts(value: string): DataUrlParts | null {
  const match = DATA_URL_RE.exec(value);
  if (!match?.[1] || !match?.[2]) return null;
  return { mimeType: match[1], base64: match[2] };
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
    `Create a photorealistic interior renovation after image for this ${input.roomType}.`,
    `Design style: ${input.style}.`,
    scope,
    brief ? `Client design brief: ${brief}.` : "",
    "The result must look like a real finished interior photograph, not a rendering, illustration, moodboard, CGI, collage, or concept sketch.",
    "Use correct perspective, physically plausible scale, realistic furniture placement, natural shadows, believable materials, and balanced real-estate photography lighting.",
    "Keep the exact camera angle, room dimensions, ceiling height, structural openings, window and door positions, and overall architecture from the input photo.",
    "Make the room feel professionally designed: cohesive furniture plan, intentional lighting layers, clear wall and floor finish direction, detailed fixtures, decor, and livable circulation.",
    "No people, no text, no captions, no logos, no watermarks, no before/after labels.",
  ]
    .filter(Boolean)
    .join(" ");
}

async function renderWithGemini(input: ConceptGenerateInput, prompt: string): Promise<string | null> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) return null;

  const image = dataUrlParts(input.sourceImageUrl);
  if (!image) return null;

  const model = process.env["GEMINI_IMAGE_MODEL"] || "gemini-2.5-flash-image-preview";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: image.mimeType,
                  data: image.base64,
                },
              },
              { text: prompt },
            ],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini image render failed (${response.status})`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { mimeType?: string; data?: string };
          inline_data?: { mime_type?: string; data?: string };
        }>;
      };
    }>;
  };
  const part = data.candidates?.[0]?.content?.parts?.find(
    (item) => item.inlineData?.data || item.inline_data?.data,
  );
  const inline = part?.inlineData ?? part?.inline_data;
  const mimeType = part?.inlineData?.mimeType ?? part?.inline_data?.mime_type ?? "image/png";
  return inline?.data ? `data:${mimeType};base64,${inline.data}` : null;
}

async function renderWithOpenAI(input: ConceptGenerateInput, prompt: string): Promise<string | null> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) return null;

  const image = dataUrlParts(input.sourceImageUrl);
  if (!image) return null;

  const bytes = Uint8Array.from(Buffer.from(image.base64, "base64"));
  const form = new FormData();
  form.set("model", process.env["OPENAI_IMAGE_MODEL"] || "gpt-image-1");
  form.set("prompt", prompt);
  form.set("size", "1024x1024");
  form.set("image", new Blob([bytes], { type: image.mimeType }), "room.png");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`OpenAI image render failed (${response.status})`);
  }

  const data = (await response.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
  const first = data.data?.[0];
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  return first?.url ?? null;
}

export async function renderRenovationAfterImage(input: ConceptGenerateInput): Promise<string | null> {
  const prompt = buildPhotorealRenovationPrompt(input);
  const provider = (process.env["RENO_RENDER_PROVIDER"] || "auto").toLowerCase();
  const order =
    provider === "openai"
      ? ["openai"]
      : provider === "gemini"
        ? ["gemini"]
        : ["gemini", "openai"];

  for (const item of order) {
    try {
      const rendered =
        item === "gemini"
          ? await renderWithGemini(input, prompt)
          : await renderWithOpenAI(input, prompt);
      if (rendered) return rendered;
    } catch (error) {
      console.warn(error);
    }
  }

  return null;
}
