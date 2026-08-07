# Reno roadmap — from working MVP to market

Honest assessment of where Reno stands and what it actually takes to charge
money for it. Nothing here is aspirational marketing; each item is a concrete
gap with a definition of done.

## Where we are today (shipped)

- Studio: upload → room/space (residential + commercial) → restyle/renovate →
  10 styles → notes → generate → before/after → download.
- Providers: Demo (no key, labeled placeholder), Gemini, OpenAI, Replicate.
  BYO key in-browser; hosted keys spend credits only after a successful render.
- Client demo projects: local-first, design direction applied to every render,
  saved concepts, "Recommended" marking, JSON export/import.
- Client proposal: branded print/PDF cover page, favorites-only printing,
  one concept per page.
- Public sharing: publish a server snapshot, get `/r/:shareId`, update or
  revoke it.
- Backend: file-backed store behind a `ProjectRepository` interface, visitor
  cookie identity, per-visitor limits, health diagnostics, three smoke suites.

**What this is good enough for today:** a solo renovator, designer, or stager
using it as a personal tool, self-hosted or local, presenting via PDF or a
link from a small VPS.

**What it is not ready for:** paying strangers, teams, or anything where losing
a client's project would be a business problem.

---

## Phase 1 — Make it trustworthy (blocks any paid launch)

The gap between "works on my machine" and "someone else's business depends on it".

### 1.1 Real persistence and accounts
- **Problem:** Projects live in one browser (`localStorage`); server copies are
  JSON on one disk keyed by a cookie. Clear your cookies or switch laptops and
  your work is gone. Images are base64 inside that JSON, so it grows fast.
- **Do:** Supabase (or Postgres) implementation of `ProjectRepository`, plus
  object storage (S3/R2/Supabase Storage) for images; store URLs, not data URLs.
  Email-link or OAuth sign-in; merge the anonymous cookie's projects on sign-up.
- **Done when:** sign in on a second device and see your projects; a project
  with 20 renders loads in under 2s; `projects.json` is no longer the system of
  record.

### 1.2 Durability and data lifecycle
- **Do:** automated backups, restore procedure that is actually tested, project
  soft-delete with a recovery window, and an export-everything button.
- **Done when:** you can restore yesterday's state from a cold backup in under
  15 minutes, documented.

### 1.3 Abuse and cost control
- **Problem:** any visitor can burn your provider credits; uploads are
  unbounded; nothing rate-limits render calls.
- **Do:** per-IP and per-account rate limits, max upload dimensions/bytes
  enforced server-side, a hard monthly spend ceiling per account, and
  server-side image downscaling before the provider call.
- **Done when:** a scripted abuser cannot exceed a configured daily spend.

### 1.4 Legal baseline
- **Do:** privacy policy, terms, and a data-deletion path (client photos are
  personal data — GDPR/CCPA apply if you take EU/CA customers). State clearly
  who owns generated images and that renders are concepts, not construction
  documents.
- **Done when:** a client can request deletion and you can honor it in one step.

## Phase 2 — Make it worth paying for

### 2.1 Payments
- Stripe Checkout for credit packs ($9/30 is already documented), webhook →
  credit balance, receipts, and a billing page. Keep BYO-key free forever;
  that's the open-core promise.
- **Done when:** a stranger can buy credits and render without you touching
  anything.

### 2.2 Multiple concepts in one pass
- Today "multiple concepts" means generate → save → repeat. Professionals want
  three styles from one photo in one action.
- **Do:** batch generation with per-concept progress, partial failure handling,
  and credit accounting per successful render.
- **Done when:** one click produces three saved concepts in a project.

### 2.3 Proposal depth
- Per-concept scope notes, rough cost ranges, material call-outs, and a simple
  cover-photo choice. This is what turns a render into a document a client signs.
- **Done when:** a contractor can produce a client-ready proposal without
  editing the PDF afterward.

### 2.4 Team use
- Multiple seats per company, shared brand settings (logo, colors, contact),
  and per-client folders. Staging companies buy seats, not single logins.

## Phase 3 — Make it grow

- **Activation instrumentation:** measure first-successful-render and
  first-saved-project; those are the only two numbers that matter early.
- **Error tracking + uptime** (Sentry-class tool, health checks, alerting).
- **Onboarding:** sample photos so a new user can render before uploading
  anything.
- **Share-page conversion:** the client viewing a share is your best lead —
  a tasteful "get your own" path without wrecking the deliverable.
- **Watermarking free renders**, removed on paid plans.
- **Mobile:** the Expo app is a prototype; either finish it or drop it. A
  responsive web Studio may be the better bet for site visits.

---

## Deliberate non-goals (for now)

- Becoming a CAD/BIM tool or producing construction documents.
- Photorealism guarantees — output quality is the provider's, not ours.
- A social feed / marketplace of designs.
- Supporting every provider; three plus Demo is enough surface area.

## Sequencing advice

Do **1.1 and 1.3 first**. Accounts + cost control unblock everything else and
are the two things most likely to embarrass you in front of a paying customer.
Payments (2.1) are comparatively easy once identity exists. Batch concepts (2.2)
is the highest-visibility feature for professionals and a good launch headline.
