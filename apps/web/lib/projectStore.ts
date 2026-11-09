import type {
  CreateDemoProjectInput,
  CreateProjectRenderInput,
  DemoProject,
  ProjectRender,
  ProjectShareLink,
  ProposalDetails,
} from "@reno/core";
import { createDemoProject, createProjectRender } from "@reno/core";

/**
 * Local-first project storage.
 *
 * The interface is Promise-based on purpose: a future hosted implementation
 * (Supabase) can drop in behind the same contract without touching the UI.
 */
export interface ProjectStore {
  list(): Promise<DemoProject[]>;
  get(id: string): Promise<DemoProject | null>;
  create(input: CreateDemoProjectInput): Promise<DemoProject>;
  importProject(project: DemoProject): Promise<DemoProject>;
  addRender(
    projectId: string,
    render: CreateProjectRenderInput
  ): Promise<ProjectRender>;
  toggleFavorite(projectId: string, renderId: string): Promise<DemoProject>;
  remove(projectId: string): Promise<void>;
  /** Attach a published server share pointer to a local project. */
  setShare(projectId: string, share: ProjectShareLink): Promise<DemoProject>;
  /** Remove the share pointer (after disabling the server share). */
  clearShare(projectId: string): Promise<DemoProject>;
  /** Save the proposal branding/scope used on the printed client PDF. */
  setProposal(
    projectId: string,
    proposal: ProposalDetails
  ): Promise<DemoProject>;
}

const STORAGE_KEY = "reno_projects";

const QUOTA_MESSAGE =
  "Browser storage is full. Export or delete a project before saving more renders.";

function isQuotaError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === "QuotaExceededError" ||
      err.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

function readAll(): DemoProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DemoProject[]) : [];
  } catch {
    return [];
  }
}

function writeAll(projects: DemoProject[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    if (isQuotaError(err)) {
      throw new Error(QUOTA_MESSAGE);
    }
    throw err;
  }
}

function mustFind(projects: DemoProject[], id: string): DemoProject {
  const project = projects.find((p) => p.id === id);
  if (!project) {
    throw new Error("Project not found. It may have been deleted.");
  }
  return project;
}

/** Loose structural check for imported JSON. */
export function looksLikeDemoProject(value: unknown): value is DemoProject {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.room === "string" &&
    Array.isArray(p.renders) &&
    Array.isArray(p.preferredStyles)
  );
}

export const localProjectStore: ProjectStore = {
  async list() {
    return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async get(id) {
    return readAll().find((p) => p.id === id) ?? null;
  },

  async create(input) {
    const project = createDemoProject(input);
    writeAll([project, ...readAll()]);
    return project;
  },

  async importProject(project) {
    if (!looksLikeDemoProject(project)) {
      throw new Error(
        "This file doesn't look like a Reno project export. Expected a project JSON exported from the Demo View."
      );
    }
    const all = readAll();
    // Avoid id collisions with an already-saved project.
    const id = all.some((p) => p.id === project.id)
      ? `${project.id}-${Date.now().toString(36)}`
      : project.id;
    const imported: DemoProject = {
      ...project,
      id,
      updatedAt: new Date().toISOString(),
    };
    writeAll([imported, ...all]);
    return imported;
  },

  async addRender(projectId, input) {
    const all = readAll();
    const project = mustFind(all, projectId);
    const render = createProjectRender(input);
    project.renders = [render, ...project.renders];
    project.updatedAt = new Date().toISOString();
    writeAll(all);
    return render;
  },

  async toggleFavorite(projectId, renderId) {
    const all = readAll();
    const project = mustFind(all, projectId);
    project.renders = project.renders.map((r) =>
      r.id === renderId ? { ...r, favorite: !r.favorite } : r
    );
    project.updatedAt = new Date().toISOString();
    writeAll(all);
    return project;
  },

  async remove(projectId) {
    writeAll(readAll().filter((p) => p.id !== projectId));
  },

  async setShare(projectId, share) {
    const all = readAll();
    const project = mustFind(all, projectId);
    project.share = share;
    project.updatedAt = new Date().toISOString();
    writeAll(all);
    return project;
  },

  async clearShare(projectId) {
    const all = readAll();
    const project = mustFind(all, projectId);
    delete project.share;
    project.updatedAt = new Date().toISOString();
    writeAll(all);
    return project;
  },

  async setProposal(projectId, proposal) {
    const all = readAll();
    const project = mustFind(all, projectId);
    const trimmed: ProposalDetails = {};
    if (proposal.businessName?.trim()) trimmed.businessName = proposal.businessName.trim();
    if (proposal.preparedBy?.trim()) trimmed.preparedBy = proposal.preparedBy.trim();
    if (proposal.contact?.trim()) trimmed.contact = proposal.contact.trim();
    if (proposal.intro?.trim()) trimmed.intro = proposal.intro.trim();
    project.proposal = trimmed;
    project.updatedAt = new Date().toISOString();
    writeAll(all);
    return project;
  },
};

/**
 * Most recently used proposal branding, so a contractor doesn't retype their
 * business details on every new client project.
 */
export async function lastUsedProposal(): Promise<ProposalDetails | null> {
  const withProposal = readAll()
    .filter((p) => p.proposal && Object.keys(p.proposal).length > 0)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return withProposal[0]?.proposal ?? null;
}

/**
 * Compresses a data-URL image before it goes into localStorage:
 * resize so the longest side is <= 1600px, re-encode as JPEG q≈0.82.
 */
export async function compressProjectImage(dataUrl: string): Promise<string> {
  if (typeof document === "undefined") return dataUrl;
  if (dataUrl.startsWith("data:image/svg+xml")) return dataUrl;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not load image for compression."));
    el.src = dataUrl;
  });

  const maxSide = 1600;
  const scale = Math.min(
    1,
    maxSide / Math.max(img.naturalWidth, img.naturalHeight)
  );
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.82);
}
