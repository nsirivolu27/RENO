"use client";

import { createDemoProject } from "@reno/core";
import type { CreateDemoProjectInput, DemoProject, ProjectRender } from "@reno/core";

const PROJECTS_KEY = "reno_projects";

export interface ProjectStore {
  list(): Promise<DemoProject[]>;
  get(id: string): Promise<DemoProject | undefined>;
  create(input: CreateDemoProjectInput): Promise<DemoProject>;
  importProject(project: DemoProject): Promise<DemoProject>;
  addRender(projectId: string, render: ProjectRender): Promise<DemoProject>;
  toggleFavorite(projectId: string, renderId: string): Promise<DemoProject>;
  remove(projectId: string): Promise<void>;
}

function readProjects(): DemoProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DemoProject[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeProjects(projects: DemoProject[]) {
  try {
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    throw new Error(
      error instanceof DOMException && error.name === "QuotaExceededError"
        ? "Browser storage is full. Export or delete a project before saving more renders."
        : "Could not save project data in this browser."
    );
  }
}

function touch(project: DemoProject): DemoProject {
  return { ...project, updatedAt: new Date().toISOString() };
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function normalizeImportedProject(input: DemoProject, existingProjects: DemoProject[]): DemoProject {
  const now = new Date().toISOString();
  const baseId = asString(input.id, `project_imported_${Date.now()}`);
  const id = existingProjects.some((project) => project.id === baseId)
    ? `${baseId}_copy_${Date.now()}`
    : baseId;

  return {
    id,
    name: asString(input.name, "Imported demo").trim() || "Imported demo",
    clientName: asString(input.clientName).trim() || undefined,
    room: asString(input.room, "living room"),
    notes: asString(input.notes).trim() || undefined,
    preferredStyles: asStringArray(input.preferredStyles),
    designDirection: asString(input.designDirection).trim() || undefined,
    renders: Array.isArray(input.renders) ? input.renders : [],
    createdAt: asString(input.createdAt, now),
    updatedAt: now
  };
}

export const localProjectStore: ProjectStore = {
  async list() {
    return readProjects().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async get(id: string) {
    return readProjects().find((project) => project.id === id);
  },
  async create(input: CreateDemoProjectInput) {
    const project = createDemoProject(input);
    writeProjects([project, ...readProjects()]);
    return project;
  },
  async importProject(project: DemoProject) {
    const projects = readProjects();
    const importedProject = normalizeImportedProject(project, projects);
    writeProjects([importedProject, ...projects]);
    return importedProject;
  },
  async addRender(projectId: string, render: ProjectRender) {
    let updated: DemoProject | undefined;
    const projects = readProjects().map((project) => {
      if (project.id !== projectId) return project;
      updated = touch({ ...project, renders: [render, ...project.renders] });
      return updated;
    });
    if (!updated) {
      throw new Error("Project not found.");
    }
    writeProjects(projects);
    return updated;
  },
  async toggleFavorite(projectId: string, renderId: string) {
    let updated: DemoProject | undefined;
    const projects = readProjects().map((project) => {
      if (project.id !== projectId) return project;
      updated = touch({
        ...project,
        renders: project.renders.map((render) =>
          render.id === renderId ? { ...render, favorite: !render.favorite } : render
        )
      });
      return updated;
    });
    if (!updated) {
      throw new Error("Project not found.");
    }
    writeProjects(projects);
    return updated;
  },
  async remove(projectId: string) {
    writeProjects(readProjects().filter((project) => project.id !== projectId));
  }
};

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not prepare image for project storage."));
    image.src = dataUrl;
  });
}

export async function compressProjectImage(dataUrl: string, maxSide = 1600, quality = 0.82): Promise<string> {
  if (!dataUrl.startsWith("data:image/")) {
    return dataUrl;
  }

  const image = await loadImage(dataUrl);
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    return dataUrl;
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}
