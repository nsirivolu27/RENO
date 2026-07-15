"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STYLES } from "@reno/core";
import type { DemoProject } from "@reno/core";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { localProjectStore } from "@/lib/projectStore";

function styleName(id: string): string {
  return STYLES.find((s) => s.id === id)?.name ?? id;
}

export default function ProjectDemo({ id }: { id: string }) {
  const router = useRouter();
  const [project, setProject] = useState<DemoProject | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localProjectStore
      .get(id)
      .then((p) => setProject(p))
      .catch(() => setError("Could not read this project from browser storage."))
      .finally(() => setLoaded(true));
  }, [id]);

  const toggleFavorite = async (renderId: string) => {
    if (!project) return;
    try {
      const updated = await localProjectStore.toggleFavorite(project.id, renderId);
      setProject(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update favorite.");
    }
  };

  const exportJson = () => {
    if (!project) return;
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "reno-project"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteProject = async () => {
    if (!project) return;
    const ok = window.confirm(
      `Delete "${project.name}" and all of its saved renders? This cannot be undone.`
    );
    if (!ok) return;
    await localProjectStore.remove(project.id);
    router.push("/projects");
  };

  if (!loaded) {
    return <div className="container">Loading project…</div>;
  }

  if (!project) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3 style={{ color: "var(--text)" }}>Project not found</h3>
          <p>
            This project isn&apos;t in this browser&apos;s storage. It may have
            been created on another device — import its JSON export instead.
          </p>
          <Link href="/projects" className="btn">
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  const favorites = project.renders.filter((r) => r.favorite).length;

  return (
    <div className="container">
      <header className="demo-header">
        <h1>{project.name}</h1>
        <p className="meta">
          {project.clientName ? `Prepared for ${project.clientName} · ` : ""}
          {project.room}
          {favorites > 0 ? ` · ★ ${favorites} favorite concept${favorites === 1 ? "" : "s"}` : ""}
        </p>

        {project.designDirection && (
          <div className="demo-direction">
            <b style={{ color: "var(--text)" }}>Design direction:</b>{" "}
            {project.designDirection}
          </div>
        )}
        {project.notes && (
          <p style={{ color: "var(--text-dim)" }}>{project.notes}</p>
        )}
        {project.preferredStyles.length > 0 && (
          <div className="chip-row" aria-label="Preferred styles">
            {project.preferredStyles.map((s) => (
              <span key={s} className="chip active" style={{ cursor: "default" }}>
                {styleName(s)}
              </span>
            ))}
          </div>
        )}

        <div className="result-actions no-print">
          <Link href={`/studio?project=${project.id}`} className="btn btn-primary">
            Generate more in Studio
          </Link>
          <button type="button" className="btn" onClick={() => window.print()}>
            Print / save as PDF
          </button>
          <button type="button" className="btn" onClick={exportJson}>
            Export JSON
          </button>
          <button type="button" className="btn btn-danger" onClick={deleteProject}>
            Delete project
          </button>
        </div>

        {error && (
          <div className="alert alert-error no-print" role="alert">
            {error}
          </div>
        )}
      </header>

      {project.renders.length === 0 ? (
        <div className="empty-state">
          <h3 style={{ color: "var(--text)" }}>No saved renders yet</h3>
          <p>
            Open this project in Studio, generate concepts, and save the best
            ones. They&apos;ll show up here as a client-ready gallery.
          </p>
          <Link href={`/studio?project=${project.id}`} className="btn btn-primary">
            Open Studio
          </Link>
        </div>
      ) : (
        <div className="render-gallery">
          {project.renders.map((r) => (
            <article key={r.id} className="render-card">
              <BeforeAfterSlider
                before={r.beforeImage}
                after={r.afterImage}
                label={`${styleName(r.style)} concept`}
              />
              <div className="render-body">
                <div className="render-meta">
                  <div className="tags">
                    <span className="badge">{styleName(r.style)}</span>
                    <span className="badge">{r.mode}</span>
                    <span className="badge">
                      {r.provider} · {r.model}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`fav-btn no-print${r.favorite ? " on" : ""}`}
                    onClick={() => toggleFavorite(r.id)}
                    aria-pressed={r.favorite}
                    aria-label={
                      r.favorite ? "Remove from favorites" : "Add to favorites"
                    }
                  >
                    {r.favorite ? "★ Favorite" : "☆ Favorite"}
                  </button>
                </div>
                {r.notes && <p className="render-notes">{r.notes}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
