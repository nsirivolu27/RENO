import type { GenerateRequest } from "./types";

export interface StylePreset {
  id: string;
  name: string;
  /** Rich materials / palette / lighting direction fed into the prompt. */
  prompt: string;
}

export const STYLES: StylePreset[] = [
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    prompt:
      "Clean modern minimalist design: low-profile furniture in matte white, warm grey and natural oak, hidden storage, crisp straight lines, one large statement artwork, wool and linen textiles, uncluttered surfaces, soft diffused daylight balanced with warm recessed lighting.",
  },
  {
    id: "scandinavian",
    name: "Scandinavian",
    prompt:
      "Scandinavian design: light oak and birch furniture, soft white and pale grey palette with muted blue-grey accents, chunky wool throws and sheepskin, simple functional silhouettes, potted greenery, paper or fabric pendant lights, abundant soft northern daylight and cozy hygge warmth.",
  },
  {
    id: "japandi",
    name: "Japandi",
    prompt:
      "Japandi (Japanese-Scandinavian) design: low wooden furniture in walnut and light ash, wabi-sabi ceramics, linen and cotton textiles in oatmeal, sand and charcoal, paper lantern lighting, clean lines with calm negative space, a single bonsai or ikebana arrangement, warm diffused light.",
  },
  {
    id: "industrial",
    name: "Industrial",
    prompt:
      "Industrial design: exposed brick tones and blackened steel, reclaimed wood surfaces, cognac leather seating, concrete-look textures, iron shelving, Edison bulb fixtures and black track lighting, oversized factory-style details, moody warm high-contrast lighting.",
  },
  {
    id: "mid-century",
    name: "Mid-Century Modern",
    prompt:
      "Mid-century modern design: teak and walnut furniture with tapered legs, mustard, burnt orange and olive accent colors, a geometric patterned rug, sputnik chandelier or arc floor lamp, brass details, sculptural ceramics, warm golden-hour lighting.",
  },
  {
    id: "bohemian",
    name: "Bohemian",
    prompt:
      "Layered bohemian design: rattan and vintage wood furniture, macrame wall hangings, Persian and kilim rugs layered on the floor, abundant trailing plants, jewel-tone velvet cushions, woven pendant lights, an eclectic gallery wall, warm candle-like cozy lighting.",
  },
  {
    id: "coastal",
    name: "Coastal",
    prompt:
      "Breezy coastal design: crisp white and sand tones, weathered driftwood textures, linen slipcovered seating, navy and seafoam accents, a jute rug, rope, rattan and sea-glass details, light sheer curtains, bright airy natural daylight like a beach house.",
  },
  {
    id: "luxury",
    name: "Luxury",
    prompt:
      "High-end luxury design: marble surfaces and brushed brass, deep emerald or navy velvet seating, a statement chandelier, silk drapes, lacquered and mirrored accents, sculptural designer decor, fresh orchids, layered warm accent lighting with five-star hotel-suite polish.",
  },
  {
    id: "farmhouse",
    name: "Modern Farmhouse",
    prompt:
      "Modern farmhouse design: shaker-style wood furniture, whitewashed and warm cream palette, matte black iron hardware, woven baskets, vintage-inspired lantern lighting, plaid and washed-linen textiles, fresh eucalyptus, rustic-yet-clean welcoming warmth.",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    prompt:
      "Cyberpunk design: neon accent lighting in magenta and cyan, LED strip details, dark matte and glossy black surfaces with gunmetal accents, sleek tech-forward furniture, holographic-style art, subtle haze, dramatic night-time glow with strong color contrast.",
  },
];

export const ROOMS: string[] = [
  "living room",
  "bedroom",
  "kitchen",
  "bathroom",
  "dining room",
  "home office",
  "kids room",
  "backyard/patio",
  "garage",
  "basement",
];

export function getStyle(id: string): StylePreset | undefined {
  return STYLES.find((s) => s.id === id);
}

/** Appended to every prompt so the architecture never drifts. */
export const ARCHITECTURE_LOCK =
  "Keep the exact camera angle, room dimensions, window and door positions, and overall architecture. Photorealistic interior photograph, professional real-estate photography quality.";

/**
 * Builds the full generation prompt for a request.
 * - restyle: swap furnishings, keep every built surface.
 * - renovate: also change built surfaces and finishes.
 */
export function buildPrompt(req: GenerateRequest): string {
  const style = getStyle(req.style);
  const styleName = style?.name ?? req.style;
  const parts: string[] = [];

  if (req.mode === "restyle") {
    parts.push(
      `Restyle this ${req.room} in the ${styleName} style. Replace the furniture, decor, rugs, art, textiles, lighting, and accessories, while preserving the existing flooring, walls, fixtures, cabinetry, and built-ins exactly as they are.`
    );
  } else {
    parts.push(
      `Renovate this ${req.room} in the ${styleName} style. Replace the furniture, decor, rugs, art, textiles, lighting, and accessories, and also update the flooring, walls, fixtures, cabinetry, finishes, and built-ins where appropriate for the style.`
    );
  }

  if (style) {
    parts.push(style.prompt);
  }

  const notes = req.notes?.trim();
  if (notes) {
    parts.push(`Additional direction: ${notes}`);
  }

  parts.push(ARCHITECTURE_LOCK);
  return parts.join(" ");
}
