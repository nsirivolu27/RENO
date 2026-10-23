"use client";

import { ROOMS, STYLES } from "@openreno/core";
import type { GenerateMode, GenerateResult } from "@openreno/core";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ProviderInfo = { id: string; name: string; model: string; configured: boolean };

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
  const [slider, setSlider] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setApiKey(localStorage.getItem("openreno.apiKey") ?? "");
    fetch("/api/generate")
      .then((response) => response.json())
      .then((data: { credits: number; providers: ProviderInfo[] }) => {
        setCredits(data.credits);
        setProviders(data.providers);
      })
      .catch(() => setError("Could not load provider status."));
  }, []);

  useEffect(() => {
    localStorage.setItem("openreno.apiKey", apiKey);
  }, [apiKey]);

  const selectedProvider = useMemo(
    () => providers.find((entry) => entry.id === provider),
    [provider, providers]
  );

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setResult(null);
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
          notes,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="studio">
      <header className="studioHeader">
        <Link href="/">OpenReno</Link>
        <span className="badge">{credits ?? "-"} credits remaining</span>
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
                {preset.name}
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
            {result ? <a className="button" download="openreno-render.png" href={result.image}>Download</a> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
