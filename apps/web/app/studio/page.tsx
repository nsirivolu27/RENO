"use client";

import { createProjectRender, ROOMS, STYLES } from "@reno/core";
import type { DemoProject, GenerateMode, GenerateResult } from "@reno/core";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { localProjectStore } from "../../lib/projectStore";

type ProviderInfo = { id: string; name: string; model: string; configured: boolean };
const API_KEY_STORAGE_KEY = "reno_key";
const PROVIDER_STORAGE_KEY = "reno_provider";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function StudioPage() {
  const [image, setImage] = useState("");
  const [room, setRoom] = useState("living room");
  const [style, setStyle] = useState("modern-minimal");
  const [mode, setMode] = useState<GenerateMode>("restyle");
  const [notes, setNotes] = useState("");
  const [provider, setProvider] = useState("gemini");
  const [apiKey, setApiKey] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [projects, setProjects] = useState<DemoProject[]>([]);
  const [projectId, setProjectId] = useState("");
  const [savedRenderId, setSavedRenderId] = useState("");
  const [slider, setSlider] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setApiKey(localStorage.getItem(API_KEY_STORAGE_KEY) ?? "");
    setProvider(localStorage.getItem(PROVIDER_STORAGE_KEY) ?? "gemini");
    const availableProjects = localProjectStore.list();
    const requestedProject = new URLSearchParams(window.location.search).get("project") ?? "";
    setProjects(availableProjects);
    if (availableProjects.some((project) => project.id === requestedProject)) {
      setProjectId(requestedProject);
    }
    fetch("/api/generate")
      .then((response) => response.json())
      .then((data: { credits: number; providers: ProviderInfo[] }) => {
        setCredits(data.credits);
        setProviders(data.providers);
      })
      .catch(() => setError("Could not load provider status."));
  }, []);

  useEffect(() => {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
  }, [provider]);

  const selectedProvider = useMemo(
    () => providers.find((entry) => entry.id === provider),
    [provider, providers]
  );
  const activeProject = useMemo(
    () => projects.find((project) => project.id === projectId),
    [projects, projectId]
  );

  function selectProject(nextProjectId: string) {
    setProjectId(nextProjectId);
    setSavedRenderId("");
    const url = nextProjectId ? `/studio?project=${encodeURIComponent(nextProjectId)}` : "/studio";
    window.history.replaceState(null, "", url);
  }

  function notesForRequest(): string {
    return [
      notes.trim(),
      activeProject?.notes ? `Project notes: ${activeProject.notes}` : "",
      activeProject?.designDirection ? `Client design direction and materials: ${activeProject.designDirection}` : ""
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setResult(null);
    setSavedRenderId("");
    setImage(await fileToDataUrl(file));
  }

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          image,
          room,
          style,
          mode,
          notes: notesForRequest(),
          provider,
          apiKey: apiKey.trim() || undefined
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Generation failed.");
      }
      setResult(data.result);
      setCredits(data.credits);
      setSlider(50);
      setSavedRenderId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  function saveToProject() {
    if (!activeProject || !result || !image) return;
    try {
      const render = createProjectRender({
        style,
        mode,
        notes: notesForRequest(),
        providerResult: result,
        beforeImage: image
      });
      const updated = localProjectStore.addRender(activeProject.id, render);
      setProjects((current) =>
        current.map((project) => (project.id === updated.id ? updated : project))
      );
      setSavedRenderId(render.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save render.");
    }
  }

  return (
    <main className="studio">
      <header className="studioHeader">
        <Link className="logo" href="/">Re<span>no</span></Link>
        <div className="projectActions">
          <Link href="/projects">Projects</Link>
          <span className="badge">{credits ?? "-"} credits remaining</span>
        </div>
      </header>

      <div className="workspace">
        <aside className="controls">
          <label
            className="dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void handleFile(event.dataTransfer.files[0]);
            }}
          >
            <input type="file" accept="image/*" onChange={(event) => void handleFile(event.target.files?.[0])} />
            {image ? <img src={image} alt="Uploaded room" /> : <span>Drop or click to upload a room photo</span>}
          </label>

          <label className="field">
            <span>Room</span>
            <select value={room} onChange={(event) => setRoom(event.target.value)}>
              {ROOMS.map((entry) => <option key={entry}>{entry}</option>)}
            </select>
          </label>

          <label className="field">
            <span>Demo project</span>
            <select value={projectId} onChange={(event) => selectProject(event.target.value)}>
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </label>
          {activeProject ? (
            <div className="projectContext">
              <strong>{activeProject.clientName || activeProject.name}</strong>
              <p>{activeProject.designDirection || "No custom design direction saved for this project."}</p>
            </div>
          ) : null}

          <div className="segmented" aria-label="Render mode">
            <button type="button" className={mode === "restyle" ? "active" : ""} onClick={() => setMode("restyle")}>Restyle</button>
            <button type="button" className={mode === "renovate" ? "active" : ""} onClick={() => setMode("renovate")}>Renovate</button>
          </div>

          <label className="field">
            <span>Provider</span>
            <select value={provider} onChange={(event) => setProvider(event.target.value)}>
              {(providers.length ? providers : [{ id: "gemini", name: "Gemini", model: "", configured: false }]).map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}{entry.configured ? " (server key)" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Optional BYO API key</span>
            <input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Stored in localStorage only" />
          </label>
          {!apiKey && selectedProvider && !selectedProvider.configured ? (
            <p className="hint">This provider needs a server key or BYO key.</p>
          ) : null}

          <label className="field">
            <span>Notes</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Keep the sofa, add warm lighting..." />
          </label>
        </aside>

        <section className="stage">
          <div className="styleGrid">
            {STYLES.map((preset) => (
              <button type="button" className={style === preset.id ? "styleTile active" : "styleTile"} key={preset.id} onClick={() => setStyle(preset.id)}>
                {preset.name}{activeProject?.preferredStyles.includes(preset.id) ? " *" : ""}
              </button>
            ))}
          </div>

          <div className="comparison">
            {image && result ? (
              <div className="compareFrame">
                <img src={image} alt="Before" />
                <img className="afterImage" src={result.image} alt="After" style={{ clipPath: `inset(0 0 0 ${slider}%)` }} />
                <div className="divider" style={{ left: `${slider}%` }} />
                <input className="slider" aria-label="Before and after comparison" type="range" min="0" max="100" value={slider} onChange={(event) => setSlider(Number(event.target.value))} />
              </div>
            ) : image ? (
              <img className="singlePreview" src={image} alt="Uploaded room preview" />
            ) : (
              <div className="emptyState">Upload a room photo to begin.</div>
            )}
          </div>

          {error ? <p className="error">{error}</p> : null}

          <div className="actions">
            <button className="button primary" disabled={!image || loading} type="button" onClick={() => void generate()}>
              {loading ? "Generating..." : result ? "Regenerate" : "Generate"}
            </button>
            {result && activeProject ? (
              <button className="button" type="button" disabled={Boolean(savedRenderId)} onClick={saveToProject}>
                {savedRenderId ? "Saved to project" : "Save to project"}
              </button>
            ) : null}
            {activeProject ? <Link className="button" href={`/projects/${activeProject.id}`}>Demo View</Link> : null}
            {result ? <a className="button" download="reno-render.png" href={result.image}>Download</a> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
