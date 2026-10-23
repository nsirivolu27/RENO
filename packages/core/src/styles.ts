import type { GenerateRequest } from "./types";

export interface StylePreset {
  id: string;
  name: string;
  prompt: string;
}

export const STYLES: StylePreset[] = [
  { id: "modern-minimal", name: "Modern Minimal", prompt: "modern minimalist interior with low-profile furniture, clean millwork, warm white walls, matte black accents, pale oak, linen upholstery, sculptural lighting, hidden storage, uncluttered surfaces, soft neutral palette, and crisp natural daylight" },
  { id: "scandinavian", name: "Scandinavian", prompt: "bright Scandinavian interior with light birch and oak woods, cozy wool and boucle textures, white plaster walls, soft grey and sage accents, functional furniture, simple ceramics, layered textiles, and airy diffused daylight" },
  { id: "japandi", name: "Japandi", prompt: "calm Japandi interior blending Japanese restraint and Scandinavian warmth, natural oak, walnut, limewash walls, woven shades, low furniture, organic ceramics, stone accents, muted earth palette, and serene indirect lighting" },
  { id: "industrial", name: "Industrial", prompt: "refined industrial interior with exposed brick or concrete, blackened steel, reclaimed wood, leather seating, metal-framed shelving, Edison-inspired warm lighting, charcoal accents, and a polished urban loft atmosphere" },
  { id: "mid-century", name: "Mid-Century", prompt: "mid-century modern interior with walnut furniture, tapered legs, warm teak, geometric rugs, brass details, globe lighting, textured upholstery, olive, rust, mustard, and cream palette, balanced vintage character and modern polish" },
  { id: "bohemian", name: "Bohemian", prompt: "layered bohemian interior with rattan, cane, vintage wood, patterned textiles, plants, handmade ceramics, macrame, warm terracotta, ochre, cream, and indigo palette, relaxed collected decor, and golden ambient light" },
  { id: "coastal", name: "Coastal", prompt: "elevated coastal interior with white oak, natural linen, slipcovered seating, woven jute, sea-glass blue and sandy neutral accents, breezy curtains, matte nickel details, and bright sunlit real-estate photography lighting" },
  { id: "luxury", name: "Luxury", prompt: "luxury contemporary interior with marble or travertine, custom built-ins, rich wood veneer, velvet and leather, brass and bronze accents, statement lighting, deep layered neutrals, gallery-quality styling, and dramatic warm lighting" },
  { id: "farmhouse", name: "Farmhouse", prompt: "modern farmhouse interior with shiplap or plaster walls, warm rustic beams, oak floors, black iron hardware, linen seating, apron-front details where appropriate, vintage pottery, creamy whites, greige, and soft natural lighting" },
  { id: "cyberpunk", name: "Cyberpunk", prompt: "tasteful cyberpunk interior with dark matte surfaces, smoked glass, modular furniture, neon magenta and cyan accent lighting, glossy black fixtures, futuristic panels, high-tech displays, and cinematic moody illumination" }
];

export const ROOMS = [
  "living room",
  "bedroom",
  "kitchen",
  "bathroom",
  "dining room",
  "home office",
  "kids room",
  "backyard/patio",
  "garage",
  "basement"
] as const;

const CAMERA_LOCK =
  "Keep the exact camera angle, room dimensions, window and door positions, and overall architecture. Photorealistic interior photograph, professional real-estate photography quality.";

export function buildPrompt(req: GenerateRequest): string {
  const preset = STYLES.find((style) => style.id === req.style);
  const modePrompt =
    req.mode === "renovate"
      ? "Renovate mode: replace furniture and decor, and also change flooring, walls, fixtures, cabinetry, finishes, and built-ins where appropriate."
      : "Restyle mode: replace furniture and decor while preserving flooring, walls, fixtures, cabinetry, and built-ins.";
  const notes = req.notes?.trim() ? `Homeowner notes: ${req.notes.trim()}.` : "";

  return [
    `Redesign this ${req.room} in ${preset?.name ?? req.style} style with ${preset?.prompt ?? req.style}.`,
    modePrompt,
    notes,
    CAMERA_LOCK
  ]
    .filter(Boolean)
    .join(" ");
}
