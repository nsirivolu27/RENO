export type StyleOption = 'Japandi' | 'Luxury' | 'Scandinavian' | 'Industrial' | 'Coastal' | 'Warm minimal';

export interface PaletteSwatch {
  name: string;
  color: string;
}

export interface ConceptBrief {
  furniture: string;
  lighting: string;
  walls: string;
  flooring: string;
  fixtures: string;
  keep: string;
  budget?: string;
}

export interface ConceptSummary {
  furniture: string;
  lighting: string;
  walls: string;
  flooring: string;
  fixtures: string;
  keep: string;
}

export interface Concept {
  id: string;
  title: string;
  client: string;
  room: string;
  style: StyleOption;
  scope: 'Restyle' | 'Renovate';
  date: string;
  createdAt: number;
  favorite: boolean;
  budget: string;
  beforeImage: string;
  image?: string; 
  brief: ConceptBrief;
  summary: ConceptSummary;
  palette: PaletteSwatch[];
  rationale: string;
}

export const STYLE_OPTIONS: StyleOption[] = [
  'Warm minimal', 'Japandi', 'Luxury', 'Scandinavian', 'Industrial', 'Coastal'
];

export const STYLE_DATA: Record<StyleOption, { palette: PaletteSwatch[], summaries: Partial<ConceptSummary>, rationale: string }> = {
  'Warm minimal': {
    palette: [
      { name: 'Oat plaster', color: '#EBE5D9' },
      { name: 'Mineral white', color: '#F5F5F0' },
      { name: 'Pale oak', color: '#D4C3A3' },
      { name: 'Bronze', color: '#8C7A6B' },
      { name: 'Sand', color: '#C2B8A3' }
    ],
    summaries: {
      furniture: 'Low-profile seating in soft, tactile fabrics with organic wood accents.',
      lighting: 'Concealed architectural lighting with a sculptural focal pendant.',
      walls: 'Warm oat plaster finish with minimal trim.',
      flooring: 'Wide-plank pale oak with an undyed wool rug.',
      fixtures: 'Bronze hardware with seamless built-in joinery.'
    },
    rationale: 'A warm, livable direction that keeps the architectural bones and makes space for the people in it. A little less noise, more room for the morning light to do its work.'
  },
  'Japandi': {
    palette: [
      { name: 'Warm white', color: '#F9F6F0' },
      { name: 'Walnut', color: '#5C4033' },
      { name: 'Linen', color: '#E3DAC9' },
      { name: 'Paper', color: '#FDFBF7' },
      { name: 'Matte black', color: '#2B2B2B' }
    ],
    summaries: {
      furniture: 'Clean-lined, low-to-the-ground walnut furniture with neutral linen upholstery.',
      lighting: 'Oversized paper lantern and soft, indirect ambient light.',
      walls: 'Soft warm white flat paint, reducing visual noise.',
      flooring: 'Light timber floors layered with a flat-weave natural rug.',
      fixtures: 'Matte black minimalist hardware and handles.'
    },
    rationale: 'This direction keeps the room calm and open while adding warmer wood tones, softer lighting, and lower-profile furniture to create a serene, functional space.'
  },
  'Luxury': {
    palette: [
      { name: 'Charcoal', color: '#333333' },
      { name: 'Marble', color: '#EBEBEB' },
      { name: 'Brass', color: '#C5A059' },
      { name: 'Velvet', color: '#1B263B' },
      { name: 'Dark oak', color: '#3A2E26' }
    ],
    summaries: {
      furniture: 'Plush velvet seating, structured silhouettes with brass detailing.',
      lighting: 'A dramatic statement chandelier paired with brass wall sconces.',
      walls: 'Deep charcoal accent wall with subtle wainscoting.',
      flooring: 'Dark oak herringbone floors under a hand-tufted silk rug.',
      fixtures: 'Polished brass hardware and marble-wrapped surfaces.'
    },
    rationale: 'This concept uses contrast, richer materials, and layered lighting to make the room feel more tailored, dramatic, and unmistakably premium.'
  },
  'Scandinavian': {
    palette: [
      { name: 'Pale ash', color: '#E6E0D4' },
      { name: 'Cloud white', color: '#F8F9FA' },
      { name: 'Soft gray', color: '#D3D9DF' },
      { name: 'Wool', color: '#E5DFD3' },
      { name: 'Ice blue', color: '#D1DEE5' }
    ],
    summaries: {
      furniture: 'Light, functional furniture with pale wood legs and soft gray wool fabric.',
      lighting: 'Airy, diffused pendant lighting and practical task lamps.',
      walls: 'Crisp cloud white walls to maximize natural light bounce.',
      flooring: 'Pale ash floorboards with a minimal light gray rug.',
      fixtures: 'Matte white and brushed nickel minimalist fixtures.'
    },
    rationale: 'Focused on breathability and function, this approach brightens the room by relying on pale woods, soft wool textures, and an abundance of reflected light.'
  },
  'Industrial': {
    palette: [
      { name: 'Brick', color: '#A05C46' },
      { name: 'Dark metal', color: '#2A2A2A' },
      { name: 'Leather', color: '#8B5A33' },
      { name: 'Concrete', color: '#9E9E9E' },
      { name: 'Warm glass', color: '#E6C687' }
    ],
    summaries: {
      furniture: 'Distressed leather sofa with raw steel-framed shelving.',
      lighting: 'Exposed warm-filament bulbs and matte black metal pendants.',
      walls: 'Exposed or faux brick texture with raw concrete accents.',
      flooring: 'Polished concrete or deeply distressed wood floors.',
      fixtures: 'Industrial pipe-style hardware and dark metal grids.'
    },
    rationale: 'By leaning into raw textures like leather, metal, and exposed elements, this direction gives the room a sense of history, grounding, and unpretentious character.'
  },
  'Coastal': {
    palette: [
      { name: 'Sand', color: '#DBCFB0' },
      { name: 'White linen', color: '#F4F4F0' },
      { name: 'Sea glass', color: '#A3C4BC' },
      { name: 'Driftwood', color: '#B5A898' },
      { name: 'Jute', color: '#C6B287' }
    ],
    summaries: {
      furniture: 'Slipcovered white linen sofas with weathered wood accent tables.',
      lighting: 'Woven rattan pendants and clear glass table lamps.',
      walls: 'Breezy white walls with soft sea-glass accents.',
      flooring: 'Driftwood-toned flooring layered with a chunky jute rug.',
      fixtures: 'Brushed nickel hardware and whitewashed timber.'
    },
    rationale: 'This direction brightens the space with breathable fabrics, pale woods, and relaxed finishes, bringing a soft, organic coastal rhythm indoors without feeling thematic.'
  }
};

export function generateDemoConcept(draft: {
  style: StyleOption;
  scope: 'Restyle' | 'Renovate';
  brief: Partial<ConceptBrief>;
}) {
  const data = STYLE_DATA[draft.style] || STYLE_DATA['Warm minimal'];
  
  const summary: ConceptSummary = {
    furniture: draft.brief.furniture || data.summaries.furniture!,
    lighting: draft.brief.lighting || data.summaries.lighting!,
    walls: draft.scope === 'Renovate' ? (draft.brief.walls || data.summaries.walls!) : 'Kept existing walls and treatments (Restyle scope).',
    flooring: draft.scope === 'Renovate' ? (draft.brief.flooring || data.summaries.flooring!) : 'Kept existing floors and rugs (Restyle scope).',
    fixtures: draft.scope === 'Renovate' ? (draft.brief.fixtures || data.summaries.fixtures!) : 'Kept existing fixtures and hardware (Restyle scope).',
    keep: draft.brief.keep || 'Camera angle, room dimensions, window and door positions.'
  };

  return { summary, palette: data.palette, rationale: data.rationale };
}

const STORAGE_KEY = 'reno_concepts';

export function saveConceptLocally(concept: Concept) {
  const existing = getSavedConcepts();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([concept, ...existing]));
}

export function getSavedConcepts(): Concept[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

const DELETED_SEEDS_KEY = 'reno_deleted_seeds';
const SEED_FAVORITES_KEY = 'reno_seed_favorites';

function readIdSet(key: string): Set<string> {
  try {
    const data = localStorage.getItem(key);
    return new Set(data ? (JSON.parse(data) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeIdSet(key: string, ids: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...ids]));
}

function isSeedId(id: string): boolean {
  return SEED_CONCEPTS.some(c => c.id === id);
}

/** All visible concepts: user-saved first, then seeds (minus deleted, with favorite overrides). */
export function getAllConcepts(): Concept[] {
  const deleted = readIdSet(DELETED_SEEDS_KEY);
  const seedFavs = readIdSet(SEED_FAVORITES_KEY);
  const seeds = SEED_CONCEPTS
    .filter(c => !deleted.has(c.id))
    .map(c => (seedFavs.has(c.id) ? { ...c, favorite: !c.favorite } : c));
  return [...getSavedConcepts(), ...seeds];
}

export function toggleFavoriteLocally(id: string) {
  if (isSeedId(id)) {
    const favs = readIdSet(SEED_FAVORITES_KEY);
    if (favs.has(id)) { favs.delete(id); } else { favs.add(id); }
    writeIdSet(SEED_FAVORITES_KEY, favs);
    return;
  }
  const existing = getSavedConcepts();
  const updated = existing.map(c => c.id === id ? { ...c, favorite: !c.favorite } : c);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function deleteConceptLocally(id: string) {
  if (isSeedId(id)) {
    const deleted = readIdSet(DELETED_SEEDS_KEY);
    deleted.add(id);
    writeIdSet(DELETED_SEEDS_KEY, deleted);
    return;
  }
  const existing = getSavedConcepts();
  const updated = existing.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearDemoConceptsLocally() {
  localStorage.removeItem(STORAGE_KEY);
}

export const SEED_CONCEPTS: Concept[] = [
  { id: 'c-104', title: 'The quiet corner', client: 'Maya & Theo', room: 'Living room', style: 'Warm minimal', scope: 'Restyle', date: 'Feb 18, 2025', createdAt: 0, favorite: true, image: 'after', beforeImage: '', budget: '$18–24k', brief: {} as any, summary: STYLE_DATA['Warm minimal'].summaries as any, palette: STYLE_DATA['Warm minimal'].palette, rationale: STYLE_DATA['Warm minimal'].rationale },
  { id: 'c-103', title: 'Sunday light', client: 'North & Pine', room: 'Kitchen', style: 'Scandinavian', scope: 'Renovate', date: 'Feb 12, 2025', createdAt: 0, favorite: false, image: 'loft', beforeImage: '', budget: '$32–40k', brief: {} as any, summary: STYLE_DATA['Scandinavian'].summaries as any, palette: STYLE_DATA['Scandinavian'].palette, rationale: STYLE_DATA['Scandinavian'].rationale },
  { id: 'c-102', title: 'A room to exhale', client: 'Elena Rodriguez', room: 'Bedroom', style: 'Warm minimal', scope: 'Restyle', date: 'Jan 29, 2025', createdAt: 0, favorite: true, image: 'studio', beforeImage: '', budget: '$14–18k', brief: {} as any, summary: STYLE_DATA['Warm minimal'].summaries as any, palette: STYLE_DATA['Warm minimal'].palette, rationale: STYLE_DATA['Warm minimal'].rationale },
  { id: 'c-101', title: 'After the rain', client: 'Oak Street Studio', room: 'Entryway', style: 'Industrial', scope: 'Restyle', date: 'Jan 21, 2025', createdAt: 0, favorite: false, image: 'before', beforeImage: '', budget: '$8–12k', brief: {} as any, summary: STYLE_DATA['Industrial'].summaries as any, palette: STYLE_DATA['Industrial'].palette, rationale: STYLE_DATA['Industrial'].rationale },
];
