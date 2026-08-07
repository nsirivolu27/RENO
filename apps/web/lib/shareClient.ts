import type { DemoProject, ProjectShareLink } from "@reno/core";
import { localProjectStore } from "@/lib/projectStore";
import { absoluteUrl } from "@/lib/appUrl";

/**
 * Publishes a public share for a local-first project.
 *
 * Local projects live in this browser (localStorage). A public `/r/:shareId`
 * page is served from the file-backed server store, so "sharing" means pushing
 * a **snapshot** of the local project to the server, then enabling its share.
 * The returned pointer is persisted on the local project so the UI can show the
 * shared state and disable it later.
 *
 * Re-publishing an already-shared project replaces the previous snapshot so the
 * public page reflects the latest saved renders.
 */

async function postJson(
  path: string,
  body?: unknown
): Promise<Record<string, unknown>> {
  const res = await fetch(path, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message = typeof data.error === "string" ? data.error : `Request failed (${res.status}).`;
    throw new Error(message);
  }
  return data;
}

/** Publishes (or re-publishes) a public share and persists the pointer locally. */
export async function publishShare(
  project: DemoProject
): Promise<ProjectShareLink> {
  // Replace any previous snapshot so the public page isn't stale.
  if (project.share) {
    await disableShare(project).catch(() => undefined);
  }

  const imported = await postJson("/api/projects/import", { project });
  const serverProject = imported.project as { id?: string } | undefined;
  const serverProjectId = serverProject?.id;
  if (!serverProjectId) {
    throw new Error("Server did not return a project id for the share.");
  }

  const shareRes = await postJson(`/api/projects/${serverProjectId}/share`);
  const shareId = typeof shareRes.shareId === "string" ? shareRes.shareId : "";
  if (!shareId) {
    throw new Error("Server did not return a share id.");
  }

  const link: ProjectShareLink = {
    shareId,
    url: `/r/${shareId}`,
    serverProjectId,
    sharedAt: new Date().toISOString(),
  };
  await localProjectStore.setShare(project.id, link);
  return link;
}

/** Disables the public share and removes the server snapshot + local pointer. */
export async function disableShare(project: DemoProject): Promise<void> {
  const serverProjectId = project.share?.serverProjectId;
  if (serverProjectId) {
    // Disable the share, then delete the server-side snapshot copy.
    await fetch(`/api/projects/${serverProjectId}/share`, { method: "DELETE" }).catch(
      () => undefined
    );
    await fetch(`/api/projects/${serverProjectId}`, { method: "DELETE" }).catch(
      () => undefined
    );
  }
  await localProjectStore.clearShare(project.id);
}

/** Absolute public URL for a share, suitable for copying/sending to a client. */
export function shareUrl(link: ProjectShareLink): string {
  return absoluteUrl(link.url);
}
