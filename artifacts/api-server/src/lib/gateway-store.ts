import type { Concept, Project, ProjectInput } from "@workspace/api-zod";

const sampleSource =
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=85";
const sampleAfter =
  "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1600&q=85";

const seedConcept: Concept = {
  id: "concept_oak_street_01",
  projectId: "project_oak_street",
  title: "The quiet corner",
  roomType: "living room",
  style: "Japandi",
  mode: "restyle",
  sourceImageUrl: sampleSource,
  resultImageUrl: sampleAfter,
  status: "completed",
  isFavorite: true,
  brief: {
    furnitureLayout: "Keep the existing sofa, open the path to the windows.",
    lighting: "Layer a warm floor lamp with soft ceiling light.",
    walls: "Keep the light walls; add one oversized art piece.",
    flooring: "Preserve the existing oak flooring and soften it with a wool rug.",
    fixtures: "Keep the black window frames and slim coffee table.",
    budget: "Thoughtful updates under $5,000.",
    mustKeep: "The sofa, window light, and open feeling of the room.",
  },
  createdAt: new Date("2026-08-07T16:30:00.000Z"),
  render: {
    success: true,
    resultImageUrl: sampleAfter,
    provider: "none",
    model: null,
    isDemo: true,
    renderId: "seed",
  },
};

const projects = new Map<string, Project>([
  [
    "project_oak_street",
    {
      id: "project_oak_street",
      name: "Oak Street Studio",
      clientName: "Maya Chen",
      location: "Portland, OR",
      conceptCount: 1,
      favoriteCount: 1,
      concepts: [seedConcept],
      createdAt: new Date("2026-08-05T10:00:00.000Z"),
      updatedAt: new Date("2026-08-07T16:30:00.000Z"),
    },
  ],
]);

const concepts = new Map<string, Concept>([[seedConcept.id, seedConcept]]);

export function listProjects(): Project[] {
  return Array.from(projects.values());
}

export function getProject(id: string): Project | undefined {
  return projects.get(id);
}

export function createProject(input: ProjectInput): Project {
  const now = new Date();
  const project: Project = {
    id: `project_${Date.now()}`,
    name: input.name,
    clientName: input.clientName ?? null,
    location: input.location ?? null,
    conceptCount: 0,
    favoriteCount: 0,
    concepts: [],
    createdAt: now,
    updatedAt: now,
  };

  projects.set(project.id, project);
  return project;
}

export function updateProject(
  id: string,
  input: Partial<ProjectInput>,
): Project | undefined {
  const project = projects.get(id);
  if (!project) return undefined;

  const updated: Project = {
    ...project,
    ...input,
    clientName: input.clientName === undefined ? project.clientName : input.clientName,
    location: input.location === undefined ? project.location : input.location,
    updatedAt: new Date(),
  };
  projects.set(id, updated);
  return updated;
}

export function addConcept(
  projectId: string | null,
  concept: Concept,
): Concept {
  concepts.set(concept.id, concept);
  if (projectId) {
    const project = projects.get(projectId);
    if (project) {
      const updated: Project = {
        ...project,
        conceptCount: project.conceptCount + 1,
        favoriteCount: project.favoriteCount + (concept.isFavorite ? 1 : 0),
        concepts: [...project.concepts, concept],
        updatedAt: new Date(),
      };
      projects.set(projectId, updated);
    }
  }
  return concept;
}

export function getConcept(id: string): Concept | undefined {
  return concepts.get(id);
}

export function updateConceptFavorite(
  id: string,
  isFavorite: boolean,
): Concept | undefined {
  const concept = concepts.get(id);
  if (!concept) return undefined;

  const updated = { ...concept, isFavorite };
  concepts.set(id, updated);

  if (concept.projectId) {
    const project = projects.get(concept.projectId);
    if (project) {
      projects.set(concept.projectId, {
        ...project,
        favoriteCount: project.concepts.filter((item) =>
          item.id === id ? isFavorite : item.isFavorite,
        ).length,
        concepts: project.concepts.map((item) =>
          item.id === id ? updated : item,
        ),
        updatedAt: new Date(),
      });
    }
  }
  return updated;
}

export function getRecentConcepts(limit = 6): Concept[] {
  return Array.from(concepts.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}