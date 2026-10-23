"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ROOMS, STYLES, formatMoneyRange } from "@reno/core";
import type {
  CompanyProfile,
  CompanyTrade,
  DemoProject,
  GenerateMode,
  Lead,
  LeadStatus,
  Offering,
  ProjectRender,
} from "@reno/core";
import { absoluteUrl, isLocalBaseUrl } from "@/lib/appUrl";
import { localProjectStore } from "@/lib/projectStore";

const TRADES: Array<{ id: CompanyTrade; label: string }> = [
  { id: "interior_design", label: "Interior design" },
  { id: "renovation", label: "Renovation" },
  { id: "furniture", label: "Furniture" },
  { id: "staging", label: "Home staging" },
  { id: "architecture", label: "Architecture" },
];

const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "won", "lost"];

function styleName(id: string): string {
  return STYLES.find((s) => s.id === id)?.name ?? id;
}

function tradeLabel(id: CompanyTrade): string {
  return TRADES.find((trade) => trade.id === id)?.label ?? "Design business";
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status}).`);
  return data;
}

export default function CompanyDashboard() {
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [activeId, setActiveId] = useState("");
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<DemoProject[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [trade, setTrade] = useState<CompanyTrade>("interior_design");
  const [tagline, setTagline] = useState("");
  const [region, setRegion] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [room, setRoom] = useState<string>(ROOMS[0] ?? "living room");
  const [style, setStyle] = useState<string>(STYLES[0]?.id ?? "modern-minimal");
  const [mode, setMode] = useState<GenerateMode>("restyle");
  const [inclusions, setInclusions] = useState("");
  const [priceLow, setPriceLow] = useState("");
  const [priceHigh, setPriceHigh] = useState("");
  const [leadTime, setLeadTime] = useState("");
  const [renderKey, setRenderKey] = useState("");

  const active = useMemo(
    () => companies.find((c) => c.id === activeId) ?? null,
    [companies, activeId]
  );

  const savedRenders = useMemo(() => {
    const all: Array<{
      key: string;
      label: string;
      render: ProjectRender;
      project: DemoProject;
    }> = [];
    for (const project of projects) {
      for (const render of project.renders) {
        all.push({
          key: `${project.id}:${render.id}`,
          label: `${project.name} - ${styleName(render.style)} (${render.mode})`,
          render,
          project,
        });
      }
    }
    return all;
  }, [projects]);

  const refreshCompany = useCallback(async (companyId: string) => {
    if (!companyId) {
      setOfferings([]);
      setLeads([]);
      return;
    }
    const offeringData = await api<{ offerings: Offering[] }>(
      `/api/companies/${companyId}/offerings`
    );
    setOfferings(offeringData.offerings);
    try {
      const leadData = await api<{ leads: Lead[] }>(
        `/api/companies/${companyId}/leads`
      );
      setLeads(leadData.leads);
    } catch {
      setLeads([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<{ companies: CompanyProfile[] }>("/api/companies");
        setCompanies(data.companies);
        if (data.companies[0]) setActiveId(data.companies[0].id);
        setProjects(await localProjectStore.list());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load companies.");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    refreshCompany(activeId).catch(() => undefined);
  }, [activeId, refreshCompany]);

  const createCompany = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const data = await api<{ company: CompanyProfile }>("/api/companies", {
        method: "POST",
        body: JSON.stringify({ name, trade, tagline, region, contactEmail }),
      });
      setCompanies((prev) => [data.company, ...prev]);
      setActiveId(data.company.id);
      setName("");
      setTagline("");
      setRegion("");
      setContactEmail("");
      setNotice(`Created ${data.company.name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create company.");
    } finally {
      setBusy(false);
    }
  };

  const createOffering = async (e: FormEvent) => {
    e.preventDefault();
    if (!active) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const attached = savedRenders.find((r) => r.key === renderKey);
      await api(`/api/companies/${active.id}/offerings`, {
        method: "POST",
        body: JSON.stringify({
          title,
          summary,
          room: attached?.project.room ?? room,
          style: attached?.render.style ?? style,
          mode: attached?.render.mode ?? mode,
          inclusions: inclusions
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
          priceLow: priceLow ? Number(priceLow) : undefined,
          priceHigh: priceHigh ? Number(priceHigh) : undefined,
          leadTime,
          beforeImage: attached?.render.beforeImage,
          afterImage: attached?.render.afterImage,
        }),
      });
      setTitle("");
      setSummary("");
      setInclusions("");
      setPriceLow("");
      setPriceHigh("");
      setLeadTime("");
      setRenderKey("");
      await refreshCompany(active.id);
      setNotice("Draft saved. Publish it when it is ready for clients.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create offering.");
    } finally {
      setBusy(false);
    }
  };

  const setOfferingStatus = async (
    offering: Offering,
    status: Offering["status"]
  ) => {
    if (!active) return;
    setError(null);
    try {
      await api(`/api/companies/${active.id}/offerings/${offering.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await refreshCompany(active.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update offering.");
    }
  };

  const removeOffering = async (offering: Offering) => {
    if (!active) return;
    if (!window.confirm(`Delete "${offering.title}"?`)) return;
    try {
      await api(`/api/companies/${active.id}/offerings/${offering.id}`, {
        method: "DELETE",
      });
      await refreshCompany(active.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete offering.");
    }
  };

  const setLeadStatus = async (lead: Lead, status: LeadStatus) => {
    if (!active) return;
    try {
      await api(`/api/companies/${active.id}/leads/${lead.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await refreshCompany(active.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update lead.");
    }
  };

  const publishedCount = offerings.filter((o) => o.status === "published").length;
  const draftCount = offerings.length - publishedCount;
  const newLeads = leads.filter((l) => l.status === "new").length;

  if (!loaded) {
    return <div className="container">Loading your workspace...</div>;
  }

  return (
    <div className="container company-page">
      <section className="company-hero">
        <div>
          <span className="company-eyebrow">For renovators and design teams</span>
          <h1>Turn room concepts into a page clients can say yes to.</h1>
          <p>
            Publish a small showcase from your Reno renders, package the work
            with scope and pricing, and collect enquiries while the client still
            has the transformation in their head.
          </p>
          <div className="company-hero-actions">
            <Link href="/studio" className="btn">
              Create a render first
            </Link>
            {active && (
              <a
                className="btn btn-primary"
                href={`/c/${active.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                Preview client page
              </a>
            )}
          </div>
        </div>
        <div className="company-hero-card" aria-label="Company workflow">
          <div>
            <b>1. Save a concept</b>
            <span>Use Studio to make before/after visuals.</span>
          </div>
          <div>
            <b>2. Package the service</b>
            <span>Add price range, timeline, and what is included.</span>
          </div>
          <div>
            <b>3. Share the page</b>
            <span>Clients submit enquiries from the public showcase.</span>
          </div>
        </div>
      </section>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      {notice && <div className="alert alert-ok">{notice}</div>}

      {companies.length > 1 && (
        <div className="field company-picker">
          <label htmlFor="company-select">Company</label>
          <select
            id="company-select"
            value={activeId}
            onChange={(e) => setActiveId(e.target.value)}
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!active ? (
        <div className="company-setup-grid">
          <form className="company-form-card" onSubmit={createCompany}>
            <div className="form-intro">
              <span className="company-eyebrow">First step</span>
              <h2>Set up your company profile</h2>
              <p>
                This is the foundation for the page prospects will see. You can
                add offerings after the profile exists.
              </p>
            </div>
            <div className="field">
              <label htmlFor="co-name">Company name</label>
              <input
                id="co-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Atelier Nine Interiors"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="co-trade">Trade</label>
              <select
                id="co-trade"
                value={trade}
                onChange={(e) => setTrade(e.target.value as CompanyTrade)}
              >
                {TRADES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="co-tagline">One-line promise</label>
              <input
                id="co-tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Warm, liveable interiors for busy families"
              />
            </div>
            <div className="field">
              <label htmlFor="co-region">Service area</label>
              <input
                id="co-region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Austin and surrounding areas"
              />
            </div>
            <div className="field">
              <label htmlFor="co-email">Contact email</label>
              <input
                id="co-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="studio@example.com"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Creating..." : "Create company"}
            </button>
          </form>

          <aside className="client-note">
            <span className="company-eyebrow">What clients will see</span>
            <h3>A simple page that sells the outcome, not the software.</h3>
            <p>
              Your public page shows your company, service area, room concepts,
              practical price ranges, and one short enquiry form.
            </p>
            <p>
              Start with one strong render from{" "}
              <Link href="/studio" style={{ color: "var(--accent)" }}>
                Studio
              </Link>
              . A clear before/after does more work than a long description.
            </p>
          </aside>
        </div>
      ) : (
        <>
          <section className="company-overview">
            <div>
              <span className="company-eyebrow">{tradeLabel(active.trade)}</span>
              <h2>{active.name}</h2>
              <p>
                {active.tagline ||
                  "Draft offerings here, then publish only the ones you are ready to show."}
              </p>
              {active.region && <p className="meta">Serving {active.region}</p>}
            </div>
            <div className="company-metrics">
              <div className="stat">
                <div className="stat-big">{publishedCount}</div>
                <div className="stat-label">live</div>
              </div>
              <div className="stat">
                <div className="stat-big">{draftCount}</div>
                <div className="stat-label">drafts</div>
              </div>
              <div className="stat">
                <div className="stat-big">{newLeads}</div>
                <div className="stat-label">new leads</div>
              </div>
            </div>
          </section>

          <div className="company-share-strip no-print">
            <div>
              <b>Client page</b>
              <span>
                Share this after at least one offering is live. Local links only
                work on this computer.
              </span>
            </div>
            <div className="share-link-row">
              <input
                type="text"
                readOnly
                value={absoluteUrl(`/c/${active.slug}`)}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Public company page link"
              />
              <button
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  navigator.clipboard.writeText(absoluteUrl(`/c/${active.slug}`))
                }
              >
                Copy
              </button>
              <a
                className="btn btn-sm btn-primary"
                href={`/c/${active.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                Open
              </a>
            </div>
          </div>

          {isLocalBaseUrl() && (
            <div className="alert alert-warn">
              This is a local preview link. Deploy Reno and set{" "}
              <code>NEXT_PUBLIC_APP_URL</code> before sending it to a real client.
            </div>
          )}

          <div className="company-work-grid">
            <form className="company-form-card" onSubmit={createOffering}>
              <div className="form-intro">
                <span className="company-eyebrow">Create an offer</span>
                <h2>Package a transformation</h2>
                <p>
                  Pick a saved render when you have one. Add only the details a
                  prospect needs to understand scope, price, and timing.
                </p>
              </div>

              <div className="field">
                <label htmlFor="of-render">Before/after visual</label>
                <select
                  id="of-render"
                  value={renderKey}
                  onChange={(e) => setRenderKey(e.target.value)}
                >
                  <option value="">No visual yet - text only</option>
                  {savedRenders.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <span className="hint">
                  {savedRenders.length === 0
                    ? "Generate a concept in Studio, save it to a project, then come back here."
                    : "Reno pulls the room, style, mode, and images from the saved render."}
                </span>
              </div>

              <div className="field">
                <label htmlFor="of-title">Service title</label>
                <input
                  id="of-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Full living room refresh"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="of-summary">Client-facing summary</label>
                <textarea
                  id="of-summary"
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="A warm, practical refresh using layered lighting, new seating, and storage."
                />
              </div>

              {!renderKey && (
                <>
                  <div className="field">
                    <label htmlFor="of-room">Space type</label>
                    <select
                      id="of-room"
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
                    <label htmlFor="of-style">Style</label>
                    <select
                      id="of-style"
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                    >
                      {STYLES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label id="of-mode-label">Scope</label>
                    <div className="seg" role="group" aria-labelledby="of-mode-label">
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
                  </div>
                </>
              )}

              <div className="field">
                <label htmlFor="of-inclusions">Included in the service</label>
                <textarea
                  id="of-inclusions"
                  rows={4}
                  value={inclusions}
                  onChange={(e) => setInclusions(e.target.value)}
                  placeholder={
                    "Design consultation\nSourcing and procurement\nDelivery and install"
                  }
                />
                <span className="hint">One line per item.</span>
              </div>

              <div className="company-price-row">
                <div className="field">
                  <label htmlFor="of-low">From</label>
                  <input
                    id="of-low"
                    type="number"
                    min="0"
                    value={priceLow}
                    onChange={(e) => setPriceLow(e.target.value)}
                    placeholder="4200"
                  />
                </div>
                <div className="field">
                  <label htmlFor="of-high">To</label>
                  <input
                    id="of-high"
                    type="number"
                    min="0"
                    value={priceHigh}
                    onChange={(e) => setPriceHigh(e.target.value)}
                    placeholder="7800"
                  />
                </div>
                <div className="field">
                  <label htmlFor="of-lead">Timeline</label>
                  <input
                    id="of-lead"
                    value={leadTime}
                    onChange={(e) => setLeadTime(e.target.value)}
                    placeholder="3-4 weeks"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Saving..." : "Save draft"}
              </button>
            </form>

            <div className="company-list-stack">
              <section className="company-section-card">
                <div className="section-title-row">
                  <div>
                    <span className="company-eyebrow">Showcase</span>
                    <h2>Offerings</h2>
                  </div>
                  <span className="subtle-count">{offerings.length} total</span>
                </div>
                {offerings.length === 0 ? (
                  <div className="friendly-empty">
                    <b>No offerings yet</b>
                    <p>
                      Create one from a saved render, then publish it when it is
                      ready for prospects.
                    </p>
                  </div>
                ) : (
                  offerings.map((offering) => (
                    <article key={offering.id} className="offering-card">
                      <div className="offering-head">
                        <div>
                          <h3>{offering.title}</h3>
                          <p className="meta">
                            {offering.room} - {styleName(offering.style)} -{" "}
                            {offering.mode === "renovate" ? "Renovation" : "Restyle"}
                            {offering.priceLow !== undefined &&
                            offering.priceHigh !== undefined
                              ? ` - ${formatMoneyRange(
                                  offering.priceLow,
                                  offering.priceHigh,
                                  offering.currency
                                )}`
                              : ""}
                          </p>
                        </div>
                        <span
                          className={`share-status${
                            offering.status === "published" ? " on" : ""
                          }`}
                        >
                          {offering.status === "published" ? "Live" : "Draft"}
                        </span>
                      </div>
                      {offering.summary && (
                        <p className="render-notes">{offering.summary}</p>
                      )}
                      {!offering.afterImage && (
                        <p className="gentle-warning">
                          Add a before/after visual when you can. It will make
                          this offer much easier for clients to understand.
                        </p>
                      )}
                      <div className="actions">
                        {offering.status === "published" ? (
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => setOfferingStatus(offering, "draft")}
                          >
                            Move to draft
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() =>
                              setOfferingStatus(offering, "published")
                            }
                          >
                            Publish
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => removeOffering(offering)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </section>

              <section className="company-section-card">
                <div className="section-title-row">
                  <div>
                    <span className="company-eyebrow">Inbox</span>
                    <h2>Enquiries</h2>
                  </div>
                  <span className="subtle-count">{leads.length} total</span>
                </div>
                {leads.length === 0 ? (
                  <div className="friendly-empty">
                    <b>No enquiries yet</b>
                    <p>
                      Once the public page is shared, client messages will land
                      here with their contact details.
                    </p>
                  </div>
                ) : (
                  leads.map((lead) => (
                    <article key={lead.id} className="lead-card">
                      <div className="offering-head">
                        <div>
                          <h3>{lead.name}</h3>
                          <p className="meta">
                            {lead.email && (
                              <a
                                href={`mailto:${lead.email}`}
                                style={{ color: "var(--accent)" }}
                              >
                                {lead.email}
                              </a>
                            )}
                            {lead.email && lead.phone ? " - " : ""}
                            {lead.phone && (
                              <a
                                href={`tel:${lead.phone}`}
                                style={{ color: "var(--accent)" }}
                              >
                                {lead.phone}
                              </a>
                            )}
                            {" - "}
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`share-status${
                            lead.status === "new" ? " on" : ""
                          }`}
                        >
                          {lead.status}
                        </span>
                      </div>
                      {lead.message && (
                        <p className="render-notes">{lead.message}</p>
                      )}
                      <div className="chip-row">
                        {LEAD_STATUSES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={`chip${lead.status === s ? " active" : ""}`}
                            onClick={() => setLeadStatus(lead, s)}
                            aria-pressed={lead.status === s}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </article>
                  ))
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
