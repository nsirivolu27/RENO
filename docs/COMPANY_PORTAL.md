# Company portal (lead generation)

The second product surface. Design studios, furniture retailers, stagers and
renovation contractors publish the work they can do, backed by real before/after
visuals. A prospect browsing that company's page sees the work brought to life
and submits an enquiry — which lands in the company's inbox as a lead.

The pitch to a company: *"Stop describing what you could do. Show it on their
actual room, and capture the enquiry while they're still excited."*

## Model

```
CompanyProfile   name, slug, trade, tagline, about, region, contacts, vendorId
  └── Offering   title, room, style, mode, before/after images, inclusions,
                 price range, lead time, status: draft | published
  └── Lead       name, email/phone, message, optional offeringId, status
```

- **Offerings start as drafts.** Nothing half-finished appears publicly.
  `listOfferings(companyId, publishedOnly)` enforces it.
- **`vendorId`** links a company to its price list in the catalog, so estimates
  on their page use *their* products (see `docs/CATALOG.md`).
- **Leads require a reply path** — a name plus an email or phone. Anything less
  is not a lead.

## Surfaces

| Route | Who | Purpose |
| --- | --- | --- |
| `/for-companies` | Owner | Dashboard: create a company, draft/publish offerings, read leads. |
| `GET/POST /api/companies` | Owner | List / create company profiles. |
| `GET/PATCH /api/companies/:id` | Owner only | Read / edit the profile. |
| `GET/POST /api/companies/:id/offerings` | Owner (drafts) / public (published) | Manage and read offerings. |
| `PATCH/DELETE /api/companies/:id/offerings/:offeringId` | Owner only | Edit, publish, unpublish, delete. |
| `POST /api/companies/:id/leads` | Public | Submit an enquiry. |
| `GET /api/companies/:id/leads` | Owner only | The enquiry inbox. |
| `PATCH /api/companies/:id/leads/:leadId` | Owner only | Move a lead: new → contacted → won/lost. |
| `/c/:slug` | Public | The showcase page prospects see. |

## The dashboard (`/for-companies`)

Set up a company, then build offerings from work you've already done: the
"Use a saved render" picker lists every render saved in your local Studio
projects, and attaching one pulls its before/after images, room, style and
mode into the offering. Add a title, summary, inclusions, price range and
timeline, save as a draft, publish when ready.

The dashboard also shows counts (published / drafts / new enquiries), the
public page link with a copy button, a warning when that link is localhost-only,
and the lead inbox with one-click status changes. Offerings without a visual are
flagged — a prospect responds to a before/after, not to a paragraph.

Ownership is the `reno_visitor` cookie, exactly like projects — see the
limitations below.

## What the showcase page does

Company header (trade, region, tagline, about, contact buttons), then published
offerings as numbered concepts with a before/after slider, price range,
inclusions and timeline, then a short enquiry form. Same editorial styling as
the client proposal pages — it should read like a studio's portfolio, not a
directory listing.

## Current limitations (be honest with pilot companies)

- **No accounts.** A company profile belongs to the browser that created it.
  Clear cookies and you lose the ability to edit or read leads. This is the
  single biggest blocker to selling this — see Phase 1.1 in `docs/ROADMAP.md`.
- **No notification.** Leads sit in the inbox; nobody gets emailed. A company
  has to check the page.
- **No moderation or spam control** on the public lead form.
- **No offering editor UI yet.** Offerings are created and published through the
  API; the showcase page renders them. The dashboard is the next build.
- Limits: 5 companies per owner, 50 offerings per company, 500 leads per company.

## Build order from here

1. **Company dashboard** (`/for-companies`): create a profile, draft offerings
   from saved Studio renders, publish, and read the lead inbox. This makes the
   portal usable without curl.
2. **Lead notifications**: email on new lead; without it, leads go cold.
3. **Accounts** (shared with the main app): real ownership, multiple staff.
4. **Estimate integration**: show the company's own catalog pricing on each
   offering, so a prospect sees "from $4,200" using that company's products.
5. **Attribution**: track which offering produced which lead, and a simple
   conversion view — the number a company will judge us on.

## Testing

`npm run smoke:marketplace` covers company creation, draft-vs-published
visibility, showcase page rendering, lead capture validation, and that the lead
inbox rejects non-owners.
