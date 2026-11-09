import type { Brief, Concept, ConceptGenerateInput } from "@workspace/api-zod";

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
    resultImageUrl: "",
    status: "completed",
    isFavorite: false,
    render: {
      success: true,
      resultImageUrl: "",
      provider: "none",
      model: null,
      isDemo: false,
      renderId: "",
    },
    brief: normalizedBrief(input.brief),
    createdAt: new Date(),
  };
}
