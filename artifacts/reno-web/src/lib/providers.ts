import type { Concept, ConceptBrief, StyleOption } from './concepts';

export interface RenderProviderInput {
  title?: string;
  room: string;
  style: StyleOption;
  scope: Concept['scope'];
  beforeImage: string;
  renderImage?: string;
  brief: Partial<ConceptBrief>;
  projectId?: string;
}

export interface RenderProviderError {
  code?: string;
  message: string;
  provider?: string;
  model?: string | null;
  renderId?: string;
}

export interface RenderProviderResult {
  afterImage?: string;
  provider: 'gemini' | 'openai' | 'none';
  model?: string | null;
  renderId?: string;
  isDemo: false;
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

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: input.title,
        roomType: input.room,
        style: input.style,
        mode: input.scope === 'Renovate' ? 'renovate' : 'restyle',
        sourceImageUrl: input.beforeImage,
        renderSourceImageUrl: input.renderImage,
        brief: normalizeBrief(input.brief),
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      resultImageUrl?: string;
      render?: {
        provider?: 'gemini' | 'openai' | 'none';
        model?: string | null;
        renderId?: string;
        isDemo?: boolean;
      };
      error?: string;
      code?: string;
      provider?: string;
      model?: string | null;
      renderId?: string;
    };

    const render = payload.render;
    if (!response.ok || !payload.resultImageUrl || !render?.renderId || !render.provider) {
      const error: RenderProviderError = {
        message: payload.error || `Render API failed with ${response.status}`,
        code: payload.code,
        provider: payload.provider,
        model: payload.model,
        renderId: payload.renderId,
      };
      throw error;
    }

    return {
      afterImage: payload.resultImageUrl,
      provider: render.provider,
      model: render.model,
      renderId: render.renderId,
      isDemo: false,
    };
  },
};

