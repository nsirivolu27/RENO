import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STYLES, formatMoneyRange } from "@reno/core";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import EnquiryForm from "./EnquiryForm";
import { getCompanyRepository } from "@/lib/companyStore";

interface ShowcaseProps {
  params: Promise<{ slug: string }>;
}

const repo = getCompanyRepository();

function styleName(id: string): string {
  return STYLES.find((style) => style.id === id)?.name ?? id;
}

const TRADE_LABEL: Record<string, string> = {
  interior_design: "Interior design",
  renovation: "Renovation",
  furniture: "Furniture",
  staging: "Home staging",
  architecture: "Architecture",
};

export async function generateMetadata({
  params,
}: ShowcaseProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await repo.getCompanyBySlug(slug);
  if (!company) return { title: "Company not found" };
  const title = `${company.name} - work and pricing`;
  const description =
    company.tagline ?? `Design and renovation work by ${company.name}.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", siteName: "Reno" },
  };
}

export default async function CompanyShowcasePage({ params }: ShowcaseProps) {
  const { slug } = await params;
  const company = await repo.getCompanyBySlug(slug);
  if (!company) notFound();

  // Public view: published offerings only.
  const offerings = await repo.listOfferings(company.id, true);

  return (
    <div className="container public-share">
      <header className="demo-header">
        <div className="share-kicker">
          {TRADE_LABEL[company.trade] ?? "Design studio"}
          {company.region ? ` - ${company.region}` : ""}
        </div>
        <h1>{company.name}</h1>
        {company.tagline && <p className="meta">{company.tagline}</p>}
        {company.about && <p className="company-about">{company.about}</p>}

        <div className="company-contact no-print">
          {company.contactEmail && (
            <a className="btn btn-sm" href={`mailto:${company.contactEmail}`}>
              Email
            </a>
          )}
          {company.contactPhone && (
            <a className="btn btn-sm" href={`tel:${company.contactPhone}`}>
              {company.contactPhone}
            </a>
          )}
          {company.website && (
            <a
              className="btn btn-sm"
              href={company.website}
              target="_blank"
              rel="noreferrer"
            >
              Website
            </a>
          )}
        </div>
      </header>

      {offerings.length === 0 ? (
        <div className="empty-state">
          <h3 style={{ color: "var(--text)" }}>No published work yet</h3>
          <p>This company hasn&apos;t published any offerings.</p>
        </div>
      ) : (
        <div className="render-gallery">
          {offerings.map((offering, index) => (
            <article key={offering.id} className="render-card concept">
              <div className="concept-head">
                <span className="concept-index">
                  {String(index + 1).padStart(2, "0")} -{" "}
                  {offering.mode === "renovate" ? "Renovation" : "Restyle"}
                </span>
                {offering.priceLow !== undefined &&
                  offering.priceHigh !== undefined && (
                    <span className="concept-flag">
                      {formatMoneyRange(
                        offering.priceLow,
                        offering.priceHigh,
                        offering.currency
                      )}
                    </span>
                  )}
              </div>

              {offering.beforeImage && offering.afterImage ? (
                <BeforeAfterSlider
                  before={offering.beforeImage}
                  after={offering.afterImage}
                  label={offering.title}
                />
              ) : offering.afterImage ? (
                <img
                  className="offering-image"
                  src={offering.afterImage}
                  alt={offering.title}
                />
              ) : null}

              <div className="render-body">
                <h2 className="concept-title">{offering.title}</h2>
                {offering.summary && (
                  <p className="render-notes">{offering.summary}</p>
                )}
                <dl className="spec-list">
                  <div>
                    <dt>Space</dt>
                    <dd>{offering.room}</dd>
                  </div>
                  <div>
                    <dt>Style</dt>
                    <dd>{styleName(offering.style)}</dd>
                  </div>
                  {offering.leadTime && (
                    <div>
                      <dt>Timeline</dt>
                      <dd>{offering.leadTime}</dd>
                    </div>
                  )}
                </dl>
                {offering.inclusions.length > 0 && (
                  <ul className="inclusion-list">
                    {offering.inclusions.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <section className="enquiry-section no-print" id="enquire">
        <h2>Request a concept for your space</h2>
        <p className="hint">
          Tell {company.name} what you&apos;re planning. They&apos;ll come back
          to you with concepts and pricing for your actual room.
        </p>
        <EnquiryForm
          companyId={company.id}
          companyName={company.name}
          offerings={offerings.map((o) => ({ id: o.id, title: o.title }))}
        />
      </section>

      <footer className="share-footer">
        <span>
          Made with{" "}
          <Link href="/" className="logo-inline">
            Re<span>no</span>
          </Link>
        </span>
        <span className="share-footer-sub">
          Concept visuals are indicative, not construction documents.
        </span>
      </footer>
    </div>
  );
}
