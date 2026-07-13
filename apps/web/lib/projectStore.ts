"use client";

import { createDemoProject } from "@reno/core";
import type { CreateDemoProjectInput, DemoProject, ProjectRender } from "@reno/core";

const PROJECTS_KEY = "reno_projects";

export interface ProjectStore {
  list(): DemoProject[];
  get(id: string): DemoProject | undefined;
  create(input: CreateDemoProjectInput): DemoProject;
  addRender(projectId: string, render: ProjectRender): DemoProject;
  toggleFavorite(projectId: string, renderId: string): DemoProject;
  remove(projectId: string): void;
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

export const localProjectStore: ProjectStore = {
  list() {
    return readProjects().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  get(id: string) {
    return readProjects().find((project) => project.id === id);
  },
  create(input: CreateDemoProjectInput) {
    const project = createDemoProject(input);
    writeProjects([project, ...readProjects()]);
    return project;
  },
  addRender(projectId: string, render: ProjectRender) {
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
  toggleFavorite(projectId: string, renderId: string) {
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
  remove(projectId: string) {
    writeProjects(readProjects().filter((project) => project.id !== projectId));
  }
};
