"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { ROOMS, STYLES } from "@reno/core";
import type { DemoProject } from "@reno/core";
import { localProjectStore } from "@/lib/projectStore";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<DemoProject[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  // Create form state
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [room, setRoom] = useState<string>(ROOMS[0] ?? "living room");
  const [notes, setNotes] = useState("");
  const [designDirection, setDesignDirection] = useState("");
  const [preferredStyles, setPreferredStyles] = useState<string[]>([]);

  const refresh = async () => {
    setProjects(await localProjectStore.list());
    setLoaded(true);
  };

  useEffect(() => {
    refresh().catch(() =>
      setError("Could not read saved projects from browser storage.")
    );
  }, []);

  const togglePreferred = (id: string) => {
    setPreferredStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const createProject = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const project = await localProjectStore.create({
        name,
        clientName,
        room,
        notes,
        designDirection,
        preferredStyles,
      });
      setName("");
      setClientName("");
      setNotes("");
      setDesignDirection("");
      setPreferredStyles([]);
      await refresh();
      setNotice(`Created "${project.name}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project.");
    }
  };

  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setNotice(null);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("That file isn't valid JSON.");
      }
      const imported = await localProjectStore.importProject(
        parsed as DemoProject
      );
      await refresh();
      setNotice(`Imported "${imported.name}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    }
  };

  return (
    <div className="container">
      <div className="studio-head">
        <div>
          <h1>Client demo projects</h1>
          <p style={{ color: "var(--text-dim)", margin: 0 }}>
            Local-first. Everything is stored in this browser. Export to move
            or back up a project.
          </p>
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => importRef.current?.click()}
        >
          Import project JSON
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          onChange={onImport}
          style={{ display: "none" }}
          aria-label="Import project JSON file"
        />
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      {notice && <div className="alert alert-ok">{notice}</div>}

      <div className="projects-grid">
        {/* -------- Create form -------- */}
        <form className="studio-panel" onSubmit={createProject}>
          <h2 style={{ fontSize: "1.15rem" }}>New project</h2>

          <div className="field">
            <label htmlFor="p-name">Project name</label>
            <input
              id="p-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maple St living room refresh"
            />
          </div>

          <div className="field">
            <label htmlFor="p-client">Client name (optional)</label>
            <input
              id="p-client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. The Novaks"
            />
          </div>

          <div className="field">
            <label htmlFor="p-room">Room / space type</label>
            <select
              id="p-room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            >
              {ROOMS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="p-notes">Project notes (optional)</label>
            <textarea
              id="p-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. budget-conscious, pets, keep the fireplace"
            />
          </div>

          <div className="field">
            <label id="p-styles-label">Preferred styles</label>
            <div className="chip-row" role="group" aria-labelledby="p-styles-label">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`chip${preferredStyles.includes(s.id) ? " active" : ""}`}
                  onClick={() => togglePreferred(s.id)}
                  aria-pressed={preferredStyles.includes(s.id)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="p-direction">
              Design direction / materials (optional)
            </label>
            <textarea
              id="p-direction"
              rows={3}
              value={designDirection}
              onChange={(e) => setDesignDirection(e.target.value)}
              placeholder="e.g. white oak floors, matte black hardware, no open shelving, warm neutral palette"
            />
            <span className="hint">
              Applied automatically to every render generated for this project.
            </span>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Create project
          </button>
        </form>

        {/* -------- Project list -------- */}
        <div>
          {!loaded ? (
            <div className="empty-state">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <h3 style={{ color: "var(--text)" }}>No projects yet</h3>
              <p>
                Create your first client demo project on the left, or import a
                project JSON exported from another device.
              </p>
              <p>
                Projects collect saved renders, client preferences, and design
                direction, then present them as a clean demo.
              </p>
            </div>
          ) : (
            projects.map((p) => (
              <div key={p.id} className="project-card">
                <h3>{p.name}</h3>
                <p className="meta">
                  {p.clientName ? `${p.clientName} - ` : ""}
                  {p.room} - {p.renders.length} render
                  {p.renders.length === 1 ? "" : "s"}
                  {p.renders.some((r) => r.favorite)
                    ? ` - ${p.renders.filter((r) => r.favorite).length} recommended`
                    : ""}
                </p>
                {p.designDirection && (
                  <p className="meta" style={{ fontStyle: "italic" }}>
                    "{p.designDirection}"
                  </p>
                )}
                <div className="actions">
                  <Link
                    href={`/studio?project=${p.id}`}
                    className="btn btn-sm btn-primary"
                  >
                    Open Studio
                  </Link>
                  <Link href={`/projects/${p.id}`} className="btn btn-sm">
                    Demo View
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
