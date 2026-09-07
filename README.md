# Reno

[![CI](https://github.com/nsirivolu27/RENO/actions/workflows/ci.yml/badge.svg)](https://github.com/nsirivolu27/RENO/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Runs with no API key](https://img.shields.io/badge/demo%20provider-no%20API%20key-ff7849)](docs/PROVIDERS.md)

Reno is an MIT open-source AI renovation/design demo app. Upload a photo of a real residential or corporate space, choose a room type and style, and generate a photorealistic redesign — same camera angle, same architecture, new design.

It serves two audiences with one engine: everyday users (homeowners, renters, office managers) who want a quick "what could this look like?", and professionals (renovators, interior designers, staging teams) who build client-ready demo projects with saved renders, favorites, and a printable demo view.

Repo: https://github.com/nsirivolu27/RENO

> **Status: under development.** This is the `rebuild` branch and it is where Reno is actively
> being built. Interfaces, routes, and the data model still change without notice, and `main`
> carries the earlier scaffold. Do not treat anything here as stable, and do not merge this
> branch into `main` without review.

Reno is an independent product. It shares no code with the LLMM, LNKZ, or lnkz-mcp
repositories, and the RSNA knee work lives only in
[`nsirivolu27/rsna-knee-abnormality-detection`](https://github.com/nsirivolu27/rsna-knee-abnormality-detection).


## Quick start

```bash
npm install
cp .env.example .env   # optional — only needed for hosted mode
npm run dev            # web app at http://localhost:3000
```

Other scripts:

```bash
npm run mobile      # Expo prototype (apps/mobile)
npm run typecheck   # strict TypeScript across all workspaces
npm run build       # production build of the web app
```

No API key configured? The app still opens and can run end-to-end with the built-in Demo provider, which returns a local placeholder render and never spends credits. For real photoreal output, paste your own Gemini, OpenAI, or Replicate key into Studio (BYO-key mode). Keys are stored only in your browser's localStorage, and BYO renders are free and unlimited.

## Demo it in a minute (no key required)

1. `npm run dev`, open http://localhost:3000/studio
2. Upload a photo of any room or space.
3. Pick a room, a mode (Restyle / Renovate), a style, and optional notes.
4. Provider stays on **Demo provider** — click **Generate redesign**. You get a labeled placeholder concept board and a before/after slider; no key, no credits.
5. On **Projects**, create a client project, open it in Studio via **Open Studio**, and **Save to project**.
6. Open the project's **Demo View**: favorite renders, **Print / save as PDF**, **Export JSON**, or **Create public share**.
7. A share publishes a server snapshot; open `/r/:shareId` to see the client-facing page.

Swap the Demo provider for Gemini/OpenAI/Replicate (with a key) anytime for real photoreal output.

## Modes

Rendering works three ways, and all three must keep working:

1. **Hosted mode** — the server has provider keys in env vars. Anonymous visitors get `FREE_CREDITS` (default 3) renders, tracked by an httpOnly cookie. Credits are spent only after a generation succeeds.
2. **Self-host / BYO-key mode** — the user pastes their own provider key in the browser. These renders bypass credits entirely and require zero Stripe, Supabase, auth, or paid Reno services.
3. **Demo mode** — the `demo` provider is always configured and needs no key. It is for validating the upload/generate/result UI without paid services; it is clearly labeled as a placeholder, not a photoreal AI render.

## Architecture

npm-workspaces monorepo, modular monolith:

```
packages/core    @reno/core — shared strict TS: types, style presets,
                 prompt builder, project model, provider implementations
apps/web         Next.js 15 App Router — UI, /api/generate, credits stub,
                 local-first project storage plus server project APIs
                 (plain CSS, no frameworks)
apps/mobile      Expo SDK 52 prototype — single-file App.tsx
```

Key boundaries: providers live only in `packages/core/src/providers/` behind the `Provider` interface; the web app's `ProjectStore` interface is Promise-based so localStorage can later be swapped for Supabase without UI changes. See `docs/ARCHITECTURE.md`.

## Backend APIs

The MVP keeps the UI local-first, but the backend now includes a self-hostable project store that writes JSON under `.reno-data/` by default. Set `RENO_DATA_DIR` to move that storage somewhere persistent in production.

- `GET /api/projects` and `POST /api/projects`
- `POST /api/projects/import`
- `GET /api/projects/:id`, `PATCH /api/projects/:id`, and `DELETE /api/projects/:id`
- `POST /api/projects/:id/renders`
- `PATCH /api/projects/:id/renders/:renderId` and `DELETE /api/projects/:id/renders/:renderId`
- `GET /api/projects/:id/share`, `POST /api/projects/:id/share`, and `DELETE /api/projects/:id/share`
- `GET /api/share/:shareId`
- `GET /api/health`

These routes are owned by the same anonymous `reno_visitor` cookie as free credits. They are intentionally easy to swap for Supabase tables later while keeping the open-core/BYO-key path working with zero paid services. File-store limits are controlled by `RENO_MAX_PROJECTS_PER_VISITOR` and `RENO_MAX_RENDERS_PER_PROJECT`.

Public project shares render at `/r/:shareId`, backed by the same server store as `GET /api/share/:shareId`. Projects are local-first in the browser; **creating a public share publishes a server-side snapshot** of that project (via `POST /api/projects/import` + `POST /api/projects/:id/share`) and stores the returned link on the local project. The editable project stays in your browser — after saving new renders, use **Update snapshot** to refresh the public page, or **Disable share** to remove it. Prefer a file instead? **Export JSON**.

## Smoke tests

With a dev server running (`npm run dev`):

```bash
npm run smoke:demo         # no-key Demo provider generate path
npm run smoke:backend      # project/render/share happy path
npm run smoke:negatives    # error paths: invalid body/image, 404s, limits
npm run smoke:marketplace  # catalog pricing, estimates, company portal, leads
npm run smoke              # all of the above
```

Point any of them at another origin with `RENO_SMOKE_BASE_URL`. To exercise the capacity limits quickly, start dev with small `RENO_MAX_PROJECTS_PER_VISITOR` / `RENO_MAX_RENDERS_PER_PROJECT` values.

## How to add a provider

1. Create `packages/core/src/providers/<name>.ts` exporting one `MODEL` constant and a `Provider` object (`id`, `name`, `model`, `generate(req, prompt, apiKey)`), returning a base64 data URL.
2. Register it in `packages/core/src/providers/index.ts`.
3. Map its env key in `apps/web/lib/credits.ts` (`serverKeyFor`).
4. Add the env var to `.env.example`.

That's it — the Studio provider dropdown and `/api/generate` pick it up automatically. Keep the `demo` provider registered so self-hosters and contributors can verify the app without any external account.

## Self-hosting

```bash
npm install && npm run build
npm run start --workspace @reno/web
```

Set env keys for hosted-style credits, or set nothing and let everyone use their own key. Reno is MIT licensed — run it anywhere, free forever.

## Docs

- `docs/CATALOG.md` — vendor pricing and how concept cost estimates are built
- `docs/COMPANY_PORTAL.md` — company showcase pages and lead capture
- `docs/DEPLOY.md` — hosting Reno so emailed client share links work
- `docs/PROVIDERS.md` — getting real photoreal output (and fixing quota/key errors)
- `docs/BACKEND.md` — server project/share APIs and storage
- `docs/PRODUCT.md` — canonical product definition
- `docs/PRODUCT_PLAN.md` — roadmap and data model
- `docs/ARCHITECTURE.md` — system design and migration paths
- `docs/CODING_STANDARDS.md` — how we write code here
- `docs/DESIGN_REFERENCES.md` — design principles
