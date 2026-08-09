import type { Brief, Concept, ConceptGenerateInput } from "@workspace/api-zod";

const demoAfterImages = [
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85",
];

const normalizedBrief = (brief: Brief): Brief => ({
  furnitureLayout: brief.furnitureLayout,
  lighting: brief.lighting,
  walls: brief.walls,
  flooring: brief.flooring,
  fixtures: brief.fixtures,
  budget: brief.budget,
  mustKeep: brief.mustKeep,
});

export function generateDemoConcept(
  input: ConceptGenerateInput,
  projectId: string | null,
  sequence: number,
): Concept {
  const styleTitle = input.style.trim();
  const roomTitle = input.roomType.trim();

  return {
    id: `concept_${Date.now()}_${sequence}`,
    projectId,
    title:
      input.title?.trim() ||
      `${styleTitle} ${roomTitle.charAt(0).toUpperCase()}${roomTitle.slice(1)}`,
    roomType: roomTitle,
    style: styleTitle,
    mode: input.mode,
    sourceImageUrl: input.sourceImageUrl,
    resultImageUrl: demoAfterImages[sequence % demoAfterImages.length],
    status: "completed",
    isFavorite: false,
    brief: normalizedBrief(input.brief),
    createdAt: new Date(),
  };
}