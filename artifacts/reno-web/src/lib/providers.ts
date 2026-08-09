import { Concept } from './concepts';

export interface ConceptRenderer {
  render(concept: Concept): React.ReactNode;
}

// TODO: When integrating a real provider (like an AI image generation API),
// implement an AIRenderer that returns an image tag with the result URL or base64.
// For now, we use the DemoAfterVisual component as our demo renderer.
