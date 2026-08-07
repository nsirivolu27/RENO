# Changelog

Notable changes to Reno. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- **Demo provider** (`demo-placeholder-v1`) — renders a clearly labeled SVG
  concept board with no API key, so the whole flow works with zero paid
  services. Default provider in Studio.
- **Client proposal output** — branded print/PDF cover page (business name,
  client, scope, contact, date), "print favorites only" toggle, and one concept
  per page.
- **Public sharing** — publish a server-side snapshot of a local project and
  get a `/r/:shareId` page for clients; update the snapshot or revoke it.
  Favorites/"Recommended" concepts appear first.
- **Server project API** — projects, renders, and shares over a file-backed
  store behind a `ProjectRepository` interface, with per-visitor limits.
- **Provider error classification** — quota, auth, access, rate-limit, safety,
  and network failures become actionable messages (including the common Google
  "image model has 0 quota" case), with one-click fallback to the Demo provider.
- **Commercial space types** — office lobby, conference room, retail space,
  restaurant/cafe, hotel room.
- **Smoke suites** — `smoke:demo`, `smoke:backend`, `smoke:negatives`, `smoke`.
- **Docs** — `docs/DEPLOY.md`, `docs/PROVIDERS.md`, `docs/BACKEND.md`,
  `docs/ROADMAP.md`.
- **CI** — typecheck, build, and all smoke suites with no provider keys, plus
  guardrail checks (no legacy branding/storage keys, no UI framework, Demo
  provider stays registered).

### Changed
- Client-facing pages restyled as design documents: serif display titles,
  numbered concepts, spec lists instead of badge rows, provider/model demoted
  to small print and hidden from the client PDF.
- Prompts now forbid people, text, logos, and watermarks in output. The
  architecture-lock sentence (camera angle, dimensions, window/door positions)
  is unchanged and still applied last.
- Share links resolve from `NEXT_PUBLIC_APP_URL`, with a warning in the UI when
  a link would only work on the local machine.
- API routes go through shared response/validation helpers instead of
  per-route duplication.

### Fixed
- Render images that are valid but non-raster (the Demo provider's SVG) are no
  longer rejected by server-side validation.
- Invalid render images now return `400 INVALID_IMAGE` instead of a generic
  failure.
- Project store writes are atomic (temp file + rename), so a concurrent read
  can't observe half-written JSON.

## [0.1.0] — initial rebuild

- npm-workspaces monorepo: `@reno/core`, `apps/web` (Next.js 15, plain CSS),
  `apps/mobile` (Expo prototype).
- Studio, local-first client demo projects, printable demo view.
- Gemini / OpenAI / Replicate providers behind a single `Provider` interface.
- Hosted credits stub with spend-after-success semantics; BYO-key renders free.
