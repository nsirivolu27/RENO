import type { GenerateMode } from "./types";

/** One saved before/after concept inside a demo project. */
export interface ProjectRender {
  id: string;
  style: string;
  mode: GenerateMode;
  notes?: string;
  provider: string;
  model: string;
  /** Base64 data URL (compressed before storage). */
  beforeImage: string;
  /** Base64 data URL (compressed before storage). */
  afterImage: string;
  favorite: boolean;
  createdAt: string;
}

/** A local-first client demo project for professionals. */
export interface DemoProject {
  id: string;
  name: string;
  clientName?: string;
  room: string;
  notes?: string;
  preferredStyles: string[];
  /** Free-form design direction: materials, constraints, client taste. */
  designDirection?: string;
  renders: ProjectRender[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDemoProjectInput {
  name?: string;
  clientName?: string;
  room: string;
  notes?: string;
  preferredStyles?: string[];
  designDirection?: string;
}

export interface CreateProjectRenderInput {
  style: string;
  mode: GenerateMode;
  notes?: string;
  provider: string;
  model: string;
  beforeImage: string;
  afterImage: string;
}

function makeId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Collapses whitespace and trims. Always returns a string. */
function clean(value: string | undefined | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

/** Like clean(), but empty results become undefined. */
function cleanOptional(value: string | undefined | null): string | undefined {
  const s = clean(value);
  return s.length > 0 ? s : undefined;
}

export function createDemoProject(input: CreateDemoProjectInput): DemoProject {
  const now = new Date().toISOString();
  return {
    id: makeId(),
    name: clean(input.name) || "Untitled demo",
    clientName: cleanOptional(input.clientName),
    room: clean(input.room) || "living room",
    notes: cleanOptional(input.notes),
    preferredStyles: (input.preferredStyles ?? [])
      .map((s) => clean(s))
      .filter((s) => s.length > 0),
    designDirection: cleanOptional(input.designDirection),
    renders: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createProjectRender(
  input: CreateProjectRenderInput
): ProjectRender {
  return {
    id: makeId(),
    style: clean(input.style),
    mode: input.mode,
    notes: cleanOptional(input.notes),
    provider: clean(input.provider),
    model: clean(input.model),
    beforeImage: input.beforeImage,
    afterImage: input.afterImage,
    favorite: false,
    createdAt: new Date().toISOString(),
  };
}
