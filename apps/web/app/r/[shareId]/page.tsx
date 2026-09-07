import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STYLES } from "@reno/core";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import PrintButton from "@/components/PrintButton";
import { getSharedProject } from "@/lib/serverProjects";

interface SharePageProps {
  params: Promise<{ shareId: string }>;
}

function styleName(id: string): string {
  return STYLES.find((style) => style.id === id)?.name ?? id;
}

function absoluteShareUrl(shareId: string): string | undefined {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return base ? `${base}/r/${shareId}` : undefined;
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { shareId } = await params;
  const shared = await getSharedProject(shareId);
  if (!shared) {
    return {
      title: "Shared Reno project not found",
    };
  }

  const title = `${shared.project.name} - Reno`;
  const description = `Before/after renovation concepts for ${shared.project.room}.`;
  const url = absoluteShareUrl(shareId);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url,
      siteName: "Reno",
    },
  };
}

export default async function PublicSharePage({ params }: SharePageProps) {
  const { shareId } = await params;
  const shared = await getSharedProject(shareId);
  if (!shared) notFound();

  const { project } = shared;
  const favorites = project.renders.filter((render) => render.favorite).length;
  // Show favorited concepts first so clients see the strongest options up top.
  const orderedRenders = [...project.renders].sort(
    (a, b) => Number(b.favorite) - Number(a.favorite)
  );

  return (
    <div className="container public-share">
      <header className="demo-header">
        <div className="share-kicker">Design concept presentation</div>
        <h1>{project.name}</h1>
        <p className="meta">
          {project.clientName ? `Prepared for ${project.clientName} - ` : ""}
          {project.room} - {project.renders.length} concept
          {project.renders.length === 1 ? "" : "s"}
          {favorites > 0 ? ` - ${favorites} recommended` : ""}
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

        <div className="result-actions no-print">
          <Link href="/studio" className="btn btn-primary">
            Create your own redesign
          </Link>
          <PrintButton />
        </div>
      </header>

      {project.renders.length === 0 ? (
        <div className="empty-state">
          <h3 style={{ color: "var(--text)" }}>No shared renders yet</h3>
          <p>This shared project exists, but it has no saved concepts.</p>
        </div>
      ) : (
        <div className="render-gallery">
          {orderedRenders.map((render, index) => (
            <article
              key={render.id}
              className={`render-card concept${render.favorite ? " is-favorite" : ""}`}
            >
              <div className="concept-head">
                <span className="concept-index">
                  Concept {String(index + 1).padStart(2, "0")}
                </span>
                {render.favorite && (
                  <span className="concept-flag">Recommended</span>
                )}
              </div>
              <BeforeAfterSlider
                before={render.beforeImage}
                after={render.afterImage}
                label={`${styleName(render.style)} concept`}
              />
              <div className="render-body">
                <h2 className="concept-title">{styleName(render.style)}</h2>
                <dl className="spec-list">
                  <div>
                    <dt>Space</dt>
                    <dd>{project.room}</dd>
                  </div>
                  <div>
                    <dt>Approach</dt>
                    <dd>
                      {render.mode === "renovate"
                        ? "Full renovation"
                        : "Restyle, existing surfaces kept"}
                    </dd>
                  </div>
                </dl>
                {render.notes && <p className="render-notes">{render.notes}</p>}
              </div>
            </article>
          ))}
        </div>
      )}

      <footer className="share-footer">
        <span>
          Made with{" "}
          <Link href="/" className="logo-inline">
            Re<span>no</span>
          </Link>
        </span>
        <span className="share-footer-sub">
          Reno is open source. Create your own client demos for free.
        </span>
      </footer>
    </div>
  );
}
