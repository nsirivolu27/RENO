import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  createDemoProject,
  createProjectRender,
  dataUrlParts,
  ROOMS,
  STYLES,
} from "@reno/core";
import type {
  CreateDemoProjectInput,
  CreateProjectRenderInput,
  DemoProject,
  ProjectRender,
} from "@reno/core";

interface StoredProject extends DemoProject {
  ownerId: string;
  shareId?: string;
}

interface ProjectDb {
  projects: StoredProject[];
}

export interface SharedProject {
  project: DemoProject;
  shareId: string;
}

const DATA_DIR = process.env.RENO_DATA_DIR || path.join(process.cwd(), ".reno-data");
const DB_PATH = path.join(DATA_DIR, "projects.json");

let writeQueue: Promise<void> = Promise.resolve();

function intEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function maxProjectsPerVisitor(): number {
  return intEnv("RENO_MAX_PROJECTS_PER_VISITOR", 100);
}

function maxRendersPerProject(): number {
  return intEnv("RENO_MAX_RENDERS_PER_PROJECT", 80);
}

function cloneProject(project: StoredProject): DemoProject {
  const { ownerId: _ownerId, shareId: _shareId, ...demoProject } = project;
  return demoProject;
}

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Validates a render image and normalizes any failure to the `INVALID_IMAGE`
 * code the API layer knows how to map. Without this, `dataUrlParts` throws its
 * own descriptive message, which the route can't recognize and would surface as
 * a generic error instead of a 400 INVALID_IMAGE.
 */
function assertDataUrl(value: string): void {
  try {
    dataUrlParts(value);
  } catch {
    throw new Error("INVALID_IMAGE");
  }
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanString(item))
    .filter((item): item is string => Boolean(item));
}

function knownRoom(value: unknown): string {
  const room = cleanString(value);
  return room && ROOMS.includes(room) ? room : "living room";
}

function knownStyles(value: unknown): string[] {
  const ids = new Set(STYLES.map((style) => style.id));
  return cleanStringArray(value).filter((style) => ids.has(style));
}

function assertProjectCapacity(db: ProjectDb, ownerId: string): void {
  const count = db.projects.filter((project) => project.ownerId === ownerId).length;
  if (count >= maxProjectsPerVisitor()) {
    throw new Error("PROJECT_LIMIT_REACHED");
  }
}

async function readDb(): Promise<ProjectDb> {
  try {
    const raw = await readFile(DB_PATH, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      Array.isArray((parsed as ProjectDb).projects)
    ) {
      return parsed as ProjectDb;
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  return { projects: [] };
}

async function writeDb(db: ProjectDb): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  // Write to a temp file then rename. Reads happen outside the write queue, so
  // a plain writeFile could be observed mid-write (torn JSON); rename is atomic
  // on the same filesystem, so a reader always sees a complete previous or new file.
  const tmpPath = path.join(DATA_DIR, `projects.${randomUUID()}.tmp`);
  await writeFile(tmpPath, JSON.stringify(db, null, 2), "utf8");
  await rename(tmpPath, DB_PATH);
}

async function updateDb<T>(fn: (db: ProjectDb) => T | Promise<T>): Promise<T> {
  const run = writeQueue.then(async () => {
    const db = await readDb();
    const result = await fn(db);
    await writeDb(db);
    return result;
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function findOwned(db: ProjectDb, ownerId: string, projectId: string): StoredProject {
  const project = db.projects.find(
    (item) => item.id === projectId && item.ownerId === ownerId
  );
  if (!project) {
    throw new Error("PROJECT_NOT_FOUND");
  }
  return project;
}

export async function listServerProjects(ownerId: string): Promise<DemoProject[]> {
  const db = await readDb();
  return db.projects
    .filter((project) => project.ownerId === ownerId)
    .map(cloneProject)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getServerProject(
  ownerId: string,
  projectId: string
): Promise<DemoProject | null> {
  const db = await readDb();
  const project = db.projects.find(
    (item) => item.id === projectId && item.ownerId === ownerId
  );
  return project ? cloneProject(project) : null;
}

export async function createServerProject(
  ownerId: string,
  body: Record<string, unknown>
): Promise<DemoProject> {
  const input: CreateDemoProjectInput = {
    name: cleanString(body.name),
    clientName: cleanString(body.clientName),
    room: knownRoom(body.room),
    notes: cleanString(body.notes),
    preferredStyles: knownStyles(body.preferredStyles),
    designDirection: cleanString(body.designDirection),
  };
  const project = createDemoProject(input);
  const stored: StoredProject = { ...project, ownerId };
  await updateDb((db) => {
    assertProjectCapacity(db, ownerId);
    db.projects.unshift(stored);
  });
  return project;
}

export async function updateServerProject(
  ownerId: string,
  projectId: string,
  body: Record<string, unknown>
): Promise<DemoProject> {
  return updateDb((db) => {
    const project = findOwned(db, ownerId, projectId);
    if ("name" in body) project.name = cleanString(body.name) || project.name;
    if ("clientName" in body) project.clientName = cleanString(body.clientName);
    if ("room" in body) project.room = knownRoom(body.room);
    if ("notes" in body) project.notes = cleanString(body.notes);
    if ("preferredStyles" in body) {
      project.preferredStyles = knownStyles(body.preferredStyles);
    }
    if ("designDirection" in body) {
      project.designDirection = cleanString(body.designDirection);
    }
    project.updatedAt = new Date().toISOString();
    return cloneProject(project);
  });
}

export async function importServerProject(
  ownerId: string,
  body: Record<string, unknown>
): Promise<DemoProject> {
  const source = body.project;
  if (typeof source !== "object" || source === null) {
    throw new Error("INVALID_PROJECT");
  }
  const raw = source as Partial<DemoProject>;
  if (
    typeof raw.id !== "string" ||
    typeof raw.name !== "string" ||
    typeof raw.room !== "string" ||
    !Array.isArray(raw.renders) ||
    !Array.isArray(raw.preferredStyles)
  ) {
    throw new Error("INVALID_PROJECT");
  }

  const now = new Date().toISOString();
  const baseProject = createDemoProject({
    name: raw.name,
    clientName: raw.clientName,
    room: knownRoom(raw.room),
    notes: raw.notes,
    preferredStyles: knownStyles(raw.preferredStyles),
    designDirection: raw.designDirection,
  });
  const renders = raw.renders.slice(0, maxRendersPerProject()).map((render) => {
    if (
      typeof render.beforeImage !== "string" ||
      typeof render.afterImage !== "string"
    ) {
      throw new Error("INVALID_PROJECT");
    }
    dataUrlParts(render.beforeImage);
    dataUrlParts(render.afterImage);
    const normalized = createProjectRender({
      style: cleanString(render.style) || "modern-minimal",
      mode: render.mode === "renovate" ? "renovate" : "restyle",
      notes: render.notes,
      provider: cleanString(render.provider) || "import",
      model: cleanString(render.model) || "unknown",
      beforeImage: render.beforeImage,
      afterImage: render.afterImage,
    });
    return {
      ...normalized,
      favorite: Boolean(render.favorite),
      createdAt:
        typeof render.createdAt === "string" ? render.createdAt : normalized.createdAt,
    };
  });
  const project: StoredProject = {
    ...baseProject,
    renders,
    ownerId,
    updatedAt: now,
  };
  await updateDb((db) => {
    assertProjectCapacity(db, ownerId);
    db.projects.unshift(project);
  });
  return cloneProject(project);
}

export async function deleteServerProject(
  ownerId: string,
  projectId: string
): Promise<void> {
  await updateDb((db) => {
    const before = db.projects.length;
    db.projects = db.projects.filter(
      (project) => project.id !== projectId || project.ownerId !== ownerId
    );
    if (db.projects.length === before) {
      throw new Error("PROJECT_NOT_FOUND");
    }
  });
}

export async function addServerRender(
  ownerId: string,
  projectId: string,
  body: Record<string, unknown>
): Promise<ProjectRender> {
  const beforeImage = cleanString(body.beforeImage);
  const afterImage = cleanString(body.afterImage);
  if (!beforeImage || !afterImage) {
    throw new Error("INVALID_IMAGE");
  }
  assertDataUrl(beforeImage);
  assertDataUrl(afterImage);

  const input: CreateProjectRenderInput = {
    style: cleanString(body.style) || "modern-minimal",
    mode: body.mode === "renovate" ? "renovate" : "restyle",
    notes: cleanString(body.notes),
    provider: cleanString(body.provider) || "unknown",
    model: cleanString(body.model) || "unknown",
    beforeImage,
    afterImage,
  };
  const render = createProjectRender(input);
  await updateDb((db) => {
    const project = findOwned(db, ownerId, projectId);
    if (project.renders.length >= maxRendersPerProject()) {
      throw new Error("RENDER_LIMIT_REACHED");
    }
    project.renders = [render, ...project.renders];
    project.updatedAt = new Date().toISOString();
  });
  return render;
}

export async function setRenderFavorite(
  ownerId: string,
  projectId: string,
  renderId: string,
  favorite?: boolean
): Promise<DemoProject> {
  return updateDb((db) => {
    const project = findOwned(db, ownerId, projectId);
    let found = false;
    project.renders = project.renders.map((render) => {
      if (render.id !== renderId) return render;
      found = true;
      return { ...render, favorite: favorite ?? !render.favorite };
    });
    if (!found) throw new Error("RENDER_NOT_FOUND");
    project.updatedAt = new Date().toISOString();
    return cloneProject(project);
  });
}

export async function deleteServerRender(
  ownerId: string,
  projectId: string,
  renderId: string
): Promise<DemoProject> {
  return updateDb((db) => {
    const project = findOwned(db, ownerId, projectId);
    const before = project.renders.length;
    project.renders = project.renders.filter((render) => render.id !== renderId);
    if (project.renders.length === before) throw new Error("RENDER_NOT_FOUND");
    project.updatedAt = new Date().toISOString();
    return cloneProject(project);
  });
}

export async function enableProjectShare(
  ownerId: string,
  projectId: string
): Promise<SharedProject> {
  return updateDb((db) => {
    const project = findOwned(db, ownerId, projectId);
    project.shareId = project.shareId || randomUUID();
    project.updatedAt = new Date().toISOString();
    return { project: cloneProject(project), shareId: project.shareId };
  });
}

export async function getProjectShare(
  ownerId: string,
  projectId: string
): Promise<SharedProject | null> {
  const db = await readDb();
  const project = db.projects.find(
    (item) => item.id === projectId && item.ownerId === ownerId
  );
  if (!project || !project.shareId) return null;
  return { project: cloneProject(project), shareId: project.shareId };
}

export async function disableProjectShare(
  ownerId: string,
  projectId: string
): Promise<DemoProject> {
  return updateDb((db) => {
    const project = findOwned(db, ownerId, projectId);
    delete project.shareId;
    project.updatedAt = new Date().toISOString();
    return cloneProject(project);
  });
}

export async function getSharedProject(
  shareId: string
): Promise<SharedProject | null> {
  const db = await readDb();
  const project = db.projects.find((item) => item.shareId === shareId);
  return project && project.shareId
    ? { project: cloneProject(project), shareId: project.shareId }
    : null;
}
