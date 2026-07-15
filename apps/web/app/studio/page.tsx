"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, DragEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ROOMS, STYLES } from "@reno/core";
import type { DemoProject, GenerateMode } from "@reno/core";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { compressProjectImage, localProjectStore } from "@/lib/projectStore";

const KEY_STORAGE = "reno_key";
const PROVIDER_STORAGE = "reno_provider";

interface ProviderInfo {
  id: string;
  name: string;
  model: string;
  configured: boolean;
}

interface RenderResult {
  image: string;
  provider: string;
  model: string;
}

function Studio() {
  const searchParams = useSearchParams();
  const urlProjectId = searchParams.get("project") ?? "";

  const [image, setImage] = useState<string | null>(null);
  const [room, setRoom] = useState<string>(ROOMS[0] ?? "living room");
  const [mode, setMode] = useState<GenerateMode>("restyle");
  const [styleId, setStyleId] = useState<string>(STYLES[0]?.id ?? "modern-minimal");
  const [notes, setNotes] = useState("");
  const [providerId, setProviderId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RenderResult | null>(null);
  const [projects, setProjects] = useState<DemoProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  // Initial load: server info, saved BYO key/provider, local projects.
  useEffect(() => {
    let cancelled = false;

    fetch("/api/generate")
      .then((res) => res.json())
      .then((data: { credits: number; providers: ProviderInfo[] }) => {
        if (cancelled) return;
        setProviders(data.providers);
        setCredits(data.credits);
        const saved = window.localStorage.getItem(PROVIDER_STORAGE);
        const valid = data.providers.some((p) => p.id === saved);
        setProviderId(
          valid && saved
            ? saved
            : (data.providers.find((p) => p.configured)?.id ??
                data.providers[0]?.id ??
                "gemini")
        );
      })
      .catch(() => {
        if (!cancelled) setError("Could not reach the Reno API.");
      });

    setApiKey(window.localStorage.getItem(KEY_STORAGE) ?? "");
    localProjectStore.list().then((all) => {
      if (!cancelled) setProjects(all);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // ?project=<id> selects an active project.
  useEffect(() => {
    if (urlProjectId) setActiveProjectId(urlProjectId);
  }, [urlProjectId]);

  // Adopt the project's room when a project becomes active.
  useEffect(() => {
    if (activeProject && ROOMS.includes(activeProject.room)) {
      setRoom(activeProject.room);
    }
  }, [activeProject]);

  const persistKey = (value: string) => {
    setApiKey(value);
    if (value.trim()) {
      window.localStorage.setItem(KEY_STORAGE, value.trim());
    } else {
      window.localStorage.removeItem(KEY_STORAGE);
    }
  };

  const persistProvider = (value: string) => {
    setProviderId(value);
    window.localStorage.setItem(PROVIDER_STORAGE, value);
  };

  const handleFile = useCallback((file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPEG, or WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(typeof reader.result === "string" ? reader.result : null);
      setResult(null);
      setError(null);
      setSaveState("idle");
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? undefined);
    e.target.value = "";
  };

  const generate = async () => {
    if (!image) {
      setError("Upload a photo of your space first.");
      return;
    }
    setLoading(true);
    setError(null);
    setSaveState("idle");

    // Project design direction and notes ride along with every render.
    const projectDirection = activeProject
      ? [activeProject.designDirection, activeProject.notes]
          .filter(Boolean)
          .join(". ")
      : "";
    const combinedNotes = [notes.trim(), projectDirection]
      .filter(Boolean)
      .join(". ");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          style: styleId,
          room,
          mode,
          notes: combinedNotes || undefined,
          provider: providerId || undefined,
          apiKey: apiKey.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        image?: string;
        provider?: string;
        model?: string;
        credits?: number;
        error?: string;
      };
      if (typeof data.credits === "number") setCredits(data.credits);
      if (!res.ok || !data.image) {
        setError(data.error ?? "Generation failed. Please try again.");
        return;
      }
      setResult({
        image: data.image,
        provider: data.provider ?? providerId,
        model: data.model ?? "",
      });
    } catch {
      setError("Network error while generating. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  const saveToProject = async () => {
    if (!activeProject || !result || !image) return;
    setSaveState("saving");
    setError(null);
    try {
      const [before, after] = await Promise.all([
        compressProjectImage(image),
        compressProjectImage(result.image),
      ]);
      await localProjectStore.addRender(activeProject.id, {
        style: styleId,
        mode,
        notes: notes.trim() || undefined,
        provider: result.provider,
        model: result.model,
        beforeImage: before,
        afterImage: after,
      });
      setProjects(await localProjectStore.list());
      setSaveState("saved");
    } catch (err) {
      setSaveState("idle");
      setError(err instanceof Error ? err.message : "Could not save render.");
    }
  };

  const usingByoKey = apiKey.trim().length > 0;
  const activeStyle = STYLES.find((s) => s.id === styleId);
  const creditsLabel = usingByoKey
    ? "Your key · unlimited"
    : credits === null
      ? "…"
      : `${credits} free render${credits === 1 ? "" : "s"} left`;

  return (
    <div className="container">
      <div className="studio-head">
        <div>
          <h1>Studio</h1>
          <p style={{ color: "var(--text-dim)", margin: 0 }}>
            Upload a photo, pick a direction, generate a redesign.
          </p>
        </div>
        <span className="badge" aria-live="polite">
          {usingByoKey ? "🔑" : "✦"} <strong>{creditsLabel}</strong>
        </span>
      </div>

      <div className="studio-grid">
        {/* -------- Controls -------- */}
        <div className="studio-panel">
          {projects.length > 0 && (
            <div className="field">
              <label htmlFor="project-select">Demo project (optional)</label>
              <select
                id="project-select"
                value={activeProjectId}
                onChange={(e) => setActiveProjectId(e.target.value)}
              >
                <option value="">No project — quick render</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.clientName ? ` — ${p.clientName}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeProject && (
            <div className="project-context">
              <p className="ctx-title">
                {activeProject.name}
                {activeProject.clientName
                  ? ` · ${activeProject.clientName}`
                  : ""}
              </p>
              {activeProject.designDirection && (
                <p>Direction: {activeProject.designDirection}</p>
              )}
              {activeProject.notes && <p>Notes: {activeProject.notes}</p>}
              <p>
                Applied to every render in this project.{" "}
                <Link
                  href={`/projects/${activeProject.id}`}
                  style={{ color: "var(--accent)" }}
                >
                  Open Demo View →
                </Link>
              </p>
            </div>
          )}

          <div className="field">
            <label htmlFor="photo-input">Photo of your space</label>
            <div
              className={`dropzone${dragOver ? " drag-over" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
              }}
              aria-label="Upload a photo of your space"
            >
              {image ? (
                <>
                  <img src={image} alt="Your uploaded space" />
                  <span>Click or drop to replace</span>
                </>
              ) : (
                <span>
                  Drag &amp; drop a photo here,
                  <br />
                  or click to browse
                </span>
              )}
            </div>
            <input
              ref={fileRef}
              id="photo-input"
              type="file"
              accept="image/*"
              onChange={onFileInput}
              style={{ display: "none" }}
            />
          </div>

          <div className="field">
            <label htmlFor="room-select">Room / space type</label>
            <select
              id="room-select"
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
            <label id="mode-label">Mode</label>
            <div className="seg" role="group" aria-labelledby="mode-label">
              <button
                type="button"
                className={mode === "restyle" ? "active" : ""}
                onClick={() => setMode("restyle")}
              >
                Restyle
              </button>
              <button
                type="button"
                className={mode === "renovate" ? "active" : ""}
                onClick={() => setMode("renovate")}
              >
                Renovate
              </button>
            </div>
            <span className="hint">
              {mode === "restyle"
                ? "Keeps flooring, walls, cabinetry, and built-ins. Swaps everything else."
                : "Also updates flooring, walls, fixtures, cabinetry, and finishes."}
            </span>
          </div>

          <div className="field">
            <label id="style-label">Style</label>
            <div className="style-grid" role="group" aria-labelledby="style-label">
              {STYLES.map((s) => {
                const preferred =
                  activeProject?.preferredStyles.includes(s.id) ?? false;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`style-card${styleId === s.id ? " active" : ""}`}
                    onClick={() => setStyleId(s.id)}
                    aria-pressed={styleId === s.id}
                  >
                    <strong>{s.name}</strong>
                    {preferred && <span className="pref">★ client preferred</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="field">
            <label htmlFor="notes-input">Notes (optional)</label>
            <textarea
              id="notes-input"
              rows={2}
              placeholder="e.g. keep the piano, add warm brass lighting"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="provider-select">Provider</label>
            <select
              id="provider-select"
              value={providerId}
              onChange={(e) => persistProvider(e.target.value)}
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.model})
                  {p.configured ? "" : " — needs your key"}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="key-input">Your API key (optional)</label>
            <input
              id="key-input"
              type="password"
              autoComplete="off"
              placeholder="Bring your own key — free, unlimited"
              value={apiKey}
              onChange={(e) => persistKey(e.target.value)}
            />
            <span className="hint">
              Stored only in this browser. BYO-key renders never spend hosted
              credits.
            </span>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%" }}
            onClick={generate}
            disabled={loading || !image}
          >
            {loading ? "Generating…" : result ? "Regenerate" : "Generate redesign"}
          </button>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}
        </div>

        {/* -------- Canvas -------- */}
        <div>
          {loading ? (
            <div className="canvas-placeholder" aria-live="polite">
              <span>
                <span className="spinner" aria-hidden="true" />
                Rendering your {room} in {activeStyle?.name ?? styleId}…
                usually 10–30 seconds.
              </span>
            </div>
          ) : result && image ? (
            <>
              <BeforeAfterSlider before={image} after={result.image} label={room} />
              <div className="result-meta">
                <span className="badge">{activeStyle?.name ?? styleId}</span>
                <span className="badge">{mode}</span>
                <span className="badge">
                  {result.provider} · {result.model}
                </span>
              </div>
              <div className="result-actions">
                <a
                  className="btn"
                  href={result.image}
                  download={`reno-${room.replace(/[^a-z0-9]+/gi, "-")}-${styleId}.png`}
                >
                  Download render
                </a>
                <button
                  type="button"
                  className="btn"
                  onClick={generate}
                  disabled={loading}
                >
                  Regenerate
                </button>
                {activeProject && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={saveToProject}
                    disabled={saveState === "saving"}
                  >
                    {saveState === "saving"
                      ? "Saving…"
                      : saveState === "saved"
                        ? "Saved ✓"
                        : "Save to project"}
                  </button>
                )}
              </div>
              {saveState === "saved" && activeProject && (
                <div className="alert alert-ok">
                  Saved to {activeProject.name}.{" "}
                  <Link
                    href={`/projects/${activeProject.id}`}
                    style={{ color: "inherit", textDecoration: "underline" }}
                  >
                    Open Demo View
                  </Link>
                </div>
              )}
            </>
          ) : image ? (
            <div className="canvas-placeholder">
              <span>
                Ready — pick a style and hit <b>Generate redesign</b>.
              </span>
            </div>
          ) : (
            <div className="canvas-placeholder">
              <span>Your before/after comparison will appear here.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="container">Loading Studio…</div>}>
      <Studio />
    </Suspense>
  );
}
