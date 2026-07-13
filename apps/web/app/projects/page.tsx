"use client";

import { ROOMS, STYLES } from "@reno/core";
import type { DemoProject } from "@reno/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { localProjectStore } from "../../lib/projectStore";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<DemoProject[]>([]);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [room, setRoom] = useState("living room");
  const [notes, setNotes] = useState("");
  const [designDirection, setDesignDirection] = useState("");
  const [preferredStyles, setPreferredStyles] = useState<string[]>(["modern-minimal"]);
  const [error, setError] = useState("");

  useEffect(() => {
    setProjects(localProjectStore.list());
  }, []);

  function toggleStyle(styleId: string) {
    setPreferredStyles((current) =>
      current.includes(styleId)
        ? current.filter((id) => id !== styleId)
        : [...current, styleId]
    );
  }

  function createProject() {
    setError("");
    try {
      const project = localProjectStore.create({
        name,
        clientName,
        room,
        notes,
        designDirection,
        preferredStyles
      });
      setProjects(localProjectStore.list());
      setName("");
      setClientName("");
      setNotes("");
      setDesignDirection("");
      setPreferredStyles(["modern-minimal"]);
      window.location.href = `/studio?project=${encodeURIComponent(project.id)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project.");
    }
  }

  return (
    <main className="projectsPage">
      <header className="studioHeader">
        <Link className="logo" href="/">Re<span>no</span></Link>
        <Link href="/studio">Studio</Link>
      </header>

      <section className="projectsHero">
        <div>
          <p className="eyebrow">Client demo projects</p>
          <h1>Package renovation ideas around a real client space.</h1>
          <p className="lede">
            Keep project direction, preferred styles, and generated concepts together in this browser. Supabase can replace this local store later without changing provider logic.
          </p>
        </div>
      </section>

      <div className="projectLayout">
        <section className="projectPanel">
          <h2>Create Demo</h2>
          <label className="field">
            <span>Project name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Maple Street kitchen refresh" />
          </label>
          <label className="field">
            <span>Client name</span>
            <input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Optional" />
          </label>
          <label className="field">
            <span>Space type</span>
            <select value={room} onChange={(event) => setRoom(event.target.value)}>
              {ROOMS.map((entry) => <option key={entry}>{entry}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Project notes</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Budget range, constraints, client goals..." />
          </label>
          <label className="field">
            <span>Custom design direction/materials</span>
            <textarea value={designDirection} onChange={(event) => setDesignDirection(event.target.value)} placeholder="White oak cabinets, zellige tile, warm brass hardware, keep existing island..." />
          </label>
          <div className="field">
            <span>Preferred styles</span>
            <div className="styleGrid compact">
              {STYLES.map((style) => (
                <button
                  type="button"
                  className={preferredStyles.includes(style.id) ? "styleTile active" : "styleTile"}
                  key={style.id}
                  onClick={() => toggleStyle(style.id)}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>
          {error ? <p className="error">{error}</p> : null}
          <button className="button primary" type="button" onClick={createProject}>Create and open Studio</button>
        </section>

        <section className="projectPanel">
          <h2>Saved Demos</h2>
          {projects.length ? (
            <div className="projectList">
              {projects.map((project) => (
                <article className="projectItem" key={project.id}>
                  <div>
                    <h3>{project.name}</h3>
                    <p>{project.clientName ? `${project.clientName} - ` : ""}{project.room}</p>
                    <p>{project.renders.length} concepts - {project.preferredStyles.length} preferred styles</p>
                  </div>
                  <div className="projectActions">
                    <Link className="button" href={`/studio?project=${project.id}`}>Open Studio</Link>
                    <Link className="button" href={`/projects/${project.id}`}>Demo View</Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="emptyState compactEmpty">No demo projects yet.</div>
          )}
        </section>
      </div>
    </main>
  );
}
