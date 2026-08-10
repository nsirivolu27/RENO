import type { Concept, ConceptBrief, StyleOption } from './concepts';

export interface RenderProviderInput {
  title?: string;
  room: string;
  style: StyleOption;
  scope: Concept['scope'];
  beforeImage: string;
  brief: Partial<ConceptBrief>;
  projectId?: string;
}

export interface RenderProviderResult {
  afterImage?: string;
  provider: 'api' | 'demo';
}

export interface ConceptRenderer {
  render(input: RenderProviderInput): Promise<RenderProviderResult>;
}

function apiBase(): string {
  return (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
}

function normalizeBrief(brief: Partial<ConceptBrief>) {
  return {
    furnitureLayout: brief.furniture || '',
    lighting: brief.lighting || '',
    walls: brief.walls || '',
    flooring: brief.flooring || '',
    fixtures: brief.fixtures || '',
    budget: brief.budget || '',
    mustKeep: brief.keep || '',
  };
}

export const apiConceptRenderer: ConceptRenderer = {
  async render(input) {
    const endpoint = input.projectId
      ? `${apiBase()}/api/projects/${input.projectId}/concepts`
      : `${apiBase()}/api/concepts`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: input.title,
          roomType: input.room,
          style: input.style,
          mode: input.scope === 'Renovate' ? 'renovate' : 'restyle',
          sourceImageUrl: input.beforeImage,
          brief: normalizeBrief(input.brief),
        }),
      });

      if (!response.ok) {
        throw new Error(`Render API failed with ${response.status}`);
      }

      const concept = (await response.json()) as { resultImageUrl?: string };
      return concept.resultImageUrl
        ? { afterImage: concept.resultImageUrl, provider: 'api' }
        : { provider: 'demo' };
    } catch (error) {
      console.warn('Falling back to Reno demo renderer.', error);
      return { provider: 'demo' };
    }
  },
};

