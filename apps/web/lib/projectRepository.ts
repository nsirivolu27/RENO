import type { DemoProject, ProjectRender } from "@reno/core";
import type { SharedProject } from "@/lib/serverProjects";
import {
  addServerRender,
  createServerProject,
  deleteServerProject,
  deleteServerRender,
  disableProjectShare,
  enableProjectShare,
  getProjectShare,
  getServerProject,
  getSharedProject,
  importServerProject,
  listServerProjects,
  setRenderFavorite,
  updateServerProject,
} from "@/lib/serverProjects";

/**
 * Storage-agnostic contract for server-side projects.
 *
 * Routes depend on this interface, not on the file store directly. When we're
 * ready to move off local files (e.g. Supabase for hosted mode), we implement
 * this once and swap it in `getProjectRepository()` — routes don't change, and
 * the local-first / self-host file path stays the default.
 */
export interface ProjectRepository {
  list(ownerId: string): Promise<DemoProject[]>;
  get(ownerId: string, projectId: string): Promise<DemoProject | null>;
  create(ownerId: string, body: Record<string, unknown>): Promise<DemoProject>;
  update(
    ownerId: string,
    projectId: string,
    body: Record<string, unknown>
  ): Promise<DemoProject>;
  import(ownerId: string, body: Record<string, unknown>): Promise<DemoProject>;
  remove(ownerId: string, projectId: string): Promise<void>;

  addRender(
    ownerId: string,
    projectId: string,
    body: Record<string, unknown>
  ): Promise<ProjectRender>;
  setRenderFavorite(
    ownerId: string,
    projectId: string,
    renderId: string,
    favorite?: boolean
  ): Promise<DemoProject>;
  removeRender(
    ownerId: string,
    projectId: string,
    renderId: string
  ): Promise<DemoProject>;

  enableShare(ownerId: string, projectId: string): Promise<SharedProject>;
  getShare(ownerId: string, projectId: string): Promise<SharedProject | null>;
  disableShare(ownerId: string, projectId: string): Promise<DemoProject>;
  getShared(shareId: string): Promise<SharedProject | null>;
}

/** File-backed implementation — the default for self-host / local-first. */
const fileProjectRepository: ProjectRepository = {
  list: listServerProjects,
  get: getServerProject,
  create: createServerProject,
  update: updateServerProject,
  import: importServerProject,
  remove: deleteServerProject,
  addRender: addServerRender,
  setRenderFavorite,
  removeRender: deleteServerRender,
  enableShare: enableProjectShare,
  getShare: getProjectShare,
  disableShare: disableProjectShare,
  getShared: getSharedProject,
};

/**
 * Returns the active project repository. Today this is always the file store;
 * a future hosted backend selects its implementation here (e.g. by env), while
 * keeping the file store as the zero-dependency default.
 */
export function getProjectRepository(): ProjectRepository {
  return fileProjectRepository;
}
