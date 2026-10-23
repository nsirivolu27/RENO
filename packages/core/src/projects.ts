import { STYLES } from "./styles";
import type { GenerateMode, GenerateResult } from "./types";

export interface ProjectRender {
  id: string;
  style: string;
  mode: GenerateMode;
  notes?: string;
  provider: string;
  model: string;
  beforeImage: string;
  afterImage: string;
  favorite: boolean;
  createdAt: string;
}

export interface DemoProject {
  id: string;
  name: string;
  clientName?: string;
  room: string;
  notes?: string;
  preferredStyles: string[];
  designDirection?: string;
  renders: ProjectRender[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDemoProjectInput {
  name: string;
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
  providerResult: GenerateResult;
  beforeImage: string;
}

function id(prefix: string): string {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${suffix}`;
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function createDemoProject(input: CreateDemoProjectInput): DemoProject {
  const now = new Date().toISOString();
  const preferredStyles = (input.preferredStyles ?? [])
    .filter((style) => STYLES.some((preset) => preset.id === style));

  return {
    id: id("project"),
    name: clean(input.name) ?? "Untitled demo",
    clientName: clean(input.clientName),
    room: input.room,
    notes: clean(input.notes),
    preferredStyles,
    designDirection: clean(input.designDirection),
    renders: [],
    createdAt: now,
    updatedAt: now
  };
}

export function createProjectRender(input: CreateProjectRenderInput): ProjectRender {
  return {
    id: id("render"),
    style: input.style,
    mode: input.mode,
    notes: clean(input.notes),
    provider: input.providerResult.provider,
    model: input.providerResult.model,
    beforeImage: input.beforeImage,
    afterImage: input.providerResult.image,
    favorite: false,
    createdAt: new Date().toISOString()
  };
}
