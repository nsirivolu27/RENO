"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STYLES } from "@reno/core";
import type { DemoProject, ProposalDetails } from "@reno/core";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { lastUsedProposal, localProjectStore } from "@/lib/projectStore";
import { disableShare, publishShare, shareUrl } from "@/lib/shareClient";
import { isLocalBaseUrl } from "@/lib/appUrl";

function styleName(id: string): string {
  return STYLES.find((s) => s.id === id)?.name ?? id;
}

export default function ProjectDemo({ id }: { id: string }) {
  const router = useRouter();
  const [project, setProject] = useState<DemoProject | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposal, setProposalState] = useState<ProposalDetails>({});
  const [proposalSaved, setProposalSaved] = useState(false);

  useEffect(() => {
    localProjectStore
      .get(id)
      .then(async (p) => {
        setProject(p);
        // Prefill branding from this project, else from the last project that
        // had it, so business details are typed once.
        if (p?.proposal && Object.keys(p.proposal).length > 0) {
          setProposalState(p.proposal);
        } else {
          const previous = await lastUsedProposal();
          if (previous) setProposalState(previous);
        }
      })
      .catch(() => setError("Could not read this project from browser storage."))
      .finally(() => setLoaded(true));
  }, [id]);

  const saveProposal = async () => {
    if (!project) return;
    try {
      const updated = await localProjectStore.setProposal(project.id, proposal);
      setProject(updated);
      setProposalSaved(true);
      window.setTimeout(() => setProposalSaved(false), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save proposal details.");
    }
  };

  const toggleFavorite = async (renderId: string) => {
    if (!project) return;
    try {
      const updated = await localProjectStore.toggleFavorite(project.id, renderId);
      setProject(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update favorite.");
    }
  };

  const createShare = async () => {
    if (!project) return;
    setShareBusy(true);
    setShareError(null);
    try {
      await publishShare(project);
      setProject(await localProjectStore.get(project.id));
    } catch (err) {
      setShareError(
        err instanceof Error ? err.message : "Could not create the public share."
      );
    } finally {
      setShareBusy(false);
    }
  };

  const removeShare = async () => {
    if (!project) return;
    setShareBusy(true);
    setShareError(null);
    try {
      await disableShare(project);
      setProject(await localProjectStore.get(project.id));
    } catch (err) {
      setShareError(
        err instanceof Error ? err.message : "Could not disable the share."
      );
    } finally {
      setShareBusy(false);
    }
  };

  const copyShare = async () => {
    if (!project?.share) return;
    try {
      await navigator.clipboard.writeText(shareUrl(project.share));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setShareError("Couldn't copy automatically — select the link and copy it.");
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
    <div
      className={`container${favoritesOnly ? " print-favorites-only" : ""}`}
    >
      {/* Printed proposal cover page — hidden on screen, first page in print. */}
      <section className="print-cover" aria-hidden="true">
        <div className="print-cover-top">
          {project.proposal?.businessName && (
            <div className="print-business">{project.proposal.businessName}</div>
          )}
          <div className="print-doc-type">Design concept proposal</div>
        </div>
        <div className="print-cover-main">
          <h1>{project.name}</h1>
          {project.clientName && (
            <p className="print-client">Prepared for {project.clientName}</p>
          )}
          <p className="print-room">{project.room}</p>
          {project.proposal?.intro && (
            <p className="print-intro">{project.proposal.intro}</p>
          )}
          {project.designDirection && (
            <p className="print-direction">
              <b>Design direction:</b> {project.designDirection}
            </p>
          )}
        </div>
        <div className="print-cover-foot">
          {project.proposal?.preparedBy && <div>{project.proposal.preparedBy}</div>}
          {project.proposal?.contact && <div>{project.proposal.contact}</div>}
          <div>
            {new Date().toLocaleDateString()} ·{" "}
            {favoritesOnly ? favorites : project.renders.length} concept
            {(favoritesOnly ? favorites : project.renders.length) === 1 ? "" : "s"}
          </div>
        </div>
      </section>

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

        <div className="proposal-panel no-print">
          <div className="proposal-head">
            <div>
              <strong>Client proposal (print / PDF)</strong>
              <p className="hint" style={{ margin: "0.15rem 0 0" }}>
                Adds a branded cover page. Print with Ctrl/Cmd+P → Save as PDF.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setProposalOpen((v) => !v)}
              aria-expanded={proposalOpen}
            >
              {proposalOpen ? "Hide details" : "Edit details"}
            </button>
          </div>

          <label className="check-row">
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={(e) => setFavoritesOnly(e.target.checked)}
            />
            <span>
              Print favorites only
              {favorites === 0 && " (none marked favorite yet)"}
            </span>
          </label>

          {proposalOpen && (
            <div className="proposal-form">
              <div className="field">
                <label htmlFor="pr-business">Business name</label>
                <input
                  id="pr-business"
                  value={proposal.businessName ?? ""}
                  onChange={(e) =>
                    setProposalState((p) => ({ ...p, businessName: e.target.value }))
                  }
                  placeholder="e.g. Novak Renovations"
                />
              </div>
              <div className="field">
                <label htmlFor="pr-by">Prepared by</label>
                <input
                  id="pr-by"
                  value={proposal.preparedBy ?? ""}
                  onChange={(e) =>
                    setProposalState((p) => ({ ...p, preparedBy: e.target.value }))
                  }
                  placeholder="e.g. Prepared by Sam Novak"
                />
              </div>
              <div className="field">
                <label htmlFor="pr-contact">Contact</label>
                <input
                  id="pr-contact"
                  value={proposal.contact ?? ""}
                  onChange={(e) =>
                    setProposalState((p) => ({ ...p, contact: e.target.value }))
                  }
                  placeholder="e.g. sam@novakreno.com · (555) 012-3456"
                />
              </div>
              <div className="field">
                <label htmlFor="pr-intro">Scope / intro</label>
                <textarea
                  id="pr-intro"
                  rows={3}
                  value={proposal.intro ?? ""}
                  onChange={(e) =>
                    setProposalState((p) => ({ ...p, intro: e.target.value }))
                  }
                  placeholder="e.g. Two concept directions for the main living space, based on our site visit on the 14th."
                />
              </div>
              <button type="button" className="btn btn-sm btn-primary" onClick={saveProposal}>
                {proposalSaved ? "Saved" : "Save proposal details"}
              </button>
            </div>
          )}
        </div>

        <div className="share-panel no-print">
          <div className="share-panel-head">
            <strong>Public share</strong>
            <span className={`share-status ${project.share ? "on" : ""}`}>
              {project.share ? "Live" : "Not shared"}
            </span>
          </div>
          {project.share ? (
            <>
              <p className="hint">
                A server-side snapshot of this project is public. Your editable
                project stays in this browser — after saving new renders, use
                Update snapshot to refresh the public page.
              </p>
              {isLocalBaseUrl() && (
                <div className="alert alert-error" role="status">
                  This link points at a local address, so it will only open on
                  this machine. Deploy Reno and set <code>NEXT_PUBLIC_APP_URL</code>{" "}
                  before emailing it — see <code>docs/DEPLOY.md</code>.
                </div>
              )}
              <div className="share-link-row">
                <input
                  type="text"
                  readOnly
                  value={shareUrl(project.share)}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="Public share link"
                />
                <button type="button" className="btn btn-sm" onClick={copyShare}>
                  {copied ? "Copied" : "Copy link"}
                </button>
                <a
                  className="btn btn-sm"
                  href={project.share.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
              </div>
              <div className="result-actions">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={createShare}
                  disabled={shareBusy}
                >
                  {shareBusy ? "Working…" : "Update snapshot"}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={removeShare}
                  disabled={shareBusy}
                >
                  Disable share
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="hint">
                Publish a public before/after page to send to a client. This
                creates a server-side snapshot; the project itself stays
                local-first in this browser. Prefer a file? Use Export JSON.
              </p>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={createShare}
                disabled={shareBusy || project.renders.length === 0}
              >
                {shareBusy ? "Publishing…" : "Create public share"}
              </button>
              {project.renders.length === 0 && (
                <span className="hint">
                  Save at least one render before sharing.
                </span>
              )}
            </>
          )}
          {shareError && (
            <div className="alert alert-error" role="alert">
              {shareError}
            </div>
          )}
        </div>
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
          {project.renders.map((r, index) => (
            <article
              key={r.id}
              className={`render-card concept${r.favorite ? " is-favorite" : ""}`}
            >
              <div className="concept-head">
                <span className="concept-index">
                  Concept {String(index + 1).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  className={`fav-btn no-print${r.favorite ? " on" : ""}`}
                  onClick={() => toggleFavorite(r.id)}
                  aria-pressed={r.favorite}
                  aria-label={
                    r.favorite
                      ? "Remove recommended mark"
                      : "Mark as recommended"
                  }
                >
                  {r.favorite ? "★ Recommended" : "☆ Recommend"}
                </button>
                {r.favorite && (
                  <span className="concept-flag print-only">Recommended</span>
                )}
              </div>
              <BeforeAfterSlider
                before={r.beforeImage}
                after={r.afterImage}
                label={`${styleName(r.style)} concept`}
              />
              <div className="render-body">
                <h2 className="concept-title">{styleName(r.style)}</h2>
                <dl className="spec-list">
                  <div>
                    <dt>Space</dt>
                    <dd>{project.room}</dd>
                  </div>
                  <div>
                    <dt>Approach</dt>
                    <dd>
                      {r.mode === "renovate"
                        ? "Full renovation"
                        : "Restyle, existing surfaces kept"}
                    </dd>
                  </div>
                </dl>
                {r.notes && <p className="render-notes">{r.notes}</p>}
                <p className="render-provenance no-print">
                  {r.provider} · {r.model}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
