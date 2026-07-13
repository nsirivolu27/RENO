"use client";

import { STYLES } from "@reno/core";
import type { DemoProject, ProjectRender } from "@reno/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { localProjectStore } from "../../../lib/projectStore";

function styleName(styleId: string): string {
  return STYLES.find((style) => style.id === styleId)?.name ?? styleId;
}

function downloadProject(project: DemoProject) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "reno-project"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function RenderCard({ render, onFavorite }: { render: ProjectRender; onFavorite: () => void }) {
  const [slider, setSlider] = useState(50);

  return (
    <article className="renderCard">
      <div className="compareFrame compactFrame">
        <img src={render.beforeImage} alt="Before" />
        <img className="afterImage" src={render.afterImage} alt="After" style={{ clipPath: `inset(0 0 0 ${slider}%)` }} />
        <div className="divider" style={{ left: `${slider}%` }} />
        <input className="slider" aria-label="Before and after comparison" type="range" min="0" max="100" value={slider} onChange={(event) => setSlider(Number(event.target.value))} />
      </div>
      <div className="renderMeta">
        <div>
          <h3>{styleName(render.style)}</h3>
          <p>{render.mode} - {render.provider} - {render.model}</p>
        </div>
        <button className={render.favorite ? "button primary" : "button"} type="button" onClick={onFavorite}>
          {render.favorite ? "Favorite" : "Mark favorite"}
        </button>
      </div>
      {render.notes ? <p className="renderNotes">{render.notes}</p> : null}
    </article>
  );
}

export default function ProjectDetailClient({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<DemoProject | null>(null);

  useEffect(() => {
    setProject(localProjectStore.get(projectId) ?? null);
  }, [projectId]);

  function toggleFavorite(renderId: string) {
    setProject(localProjectStore.toggleFavorite(projectId, renderId));
  }

  function removeProject() {
    localProjectStore.remove(projectId);
    window.location.href = "/projects";
  }

  if (!project) {
    return (
      <main className="projectsPage">
        <header className="studioHeader">
          <Link className="logo" href="/">Re<span>no</span></Link>
          <Link href="/projects">Projects</Link>
        </header>
        <div className="emptyState">Project not found in this browser.</div>
      </main>
    );
  }

  const favoriteCount = project.renders.filter((render) => render.favorite).length;

  return (
    <main className="projectsPage demoView">
      <header className="studioHeader">
        <Link className="logo" href="/">Re<span>no</span></Link>
        <div className="projectActions">
          <Link className="button" href={`/studio?project=${project.id}`}>Open Studio</Link>
          <Link className="button" href="/projects">Projects</Link>
        </div>
      </header>

      <section className="projectsHero printHeader">
        <div>
          <p className="eyebrow">{project.clientName || "Client demo"}</p>
          <h1>{project.name}</h1>
          <p className="lede">{project.room} - {project.renders.length} concepts - {favoriteCount} favorites</p>
        </div>
        <div className="demoActions">
          <button className="button" type="button" onClick={() => downloadProject(project)}>Export JSON</button>
          <button className="button dangerButton" type="button" onClick={removeProject}>Delete</button>
        </div>
      </section>

      <section className="projectSummary">
        <article>
          <h2>Project Direction</h2>
          <p>{project.designDirection || "No custom design direction yet."}</p>
        </article>
        <article>
          <h2>Notes</h2>
          <p>{project.notes || "No project notes yet."}</p>
        </article>
        <article>
          <h2>Preferred Styles</h2>
          <p>{project.preferredStyles.map(styleName).join(", ") || "None selected"}</p>
        </article>
      </section>

      <section className="renderGrid">
        {project.renders.length ? (
          project.renders.map((render) => (
            <RenderCard key={render.id} render={render} onFavorite={() => toggleFavorite(render.id)} />
          ))
        ) : (
          <div className="emptyState">No saved concepts yet. Open Studio and save a render to this project.</div>
        )}
      </section>
    </main>
  );
}
