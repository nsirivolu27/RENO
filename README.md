# Reno

Reno is an MIT open-source AI renovation/design demo app. Upload a photo of a real residential or corporate space, choose a room type and style, and generate a photorealistic redesign — same camera angle, same architecture, new design.

It serves two audiences with one engine: everyday users (homeowners, renters, office managers) who want a quick "what could this look like?", and professionals (renovators, interior designers, staging teams) who build client-ready demo projects with saved renders, favorites, and a printable demo view.

Repo: https://github.com/nsirivolu27/RENO

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

No API key configured? The app still fully works: paste your own Gemini, OpenAI, or Replicate key into Studio (BYO-key mode). Keys are stored only in your browser's localStorage, and BYO renders are free and unlimited.

## The two modes

Reno always works in both of these, and both must stay working:

1. **Hosted mode** — the server has provider keys in env vars. Anonymous visitors get `FREE_CREDITS` (default 3) renders, tracked by an httpOnly cookie. Credits are spent only after a generation succeeds.
2. **Self-host / BYO-key mode** — the user pastes their own provider key in the browser. These renders bypass credits entirely and require zero Stripe, Supabase, auth, or paid Reno services.

## Architecture

npm-workspaces monorepo, modular monolith:

```
packages/core    @reno/core — shared strict TS: types, style presets,
                 prompt builder, project model, provider implementations
apps/web         Next.js 15 App Router — UI, /api/generate, credits stub,
                 local-first project storage (plain CSS, no frameworks)
apps/mobile      Expo SDK 52 prototype — single-file App.tsx
```

Key boundaries: providers live only in `packages/core/src/providers/` behind the `Provider` interface; the web app's `ProjectStore` interface is Promise-based so localStorage can later be swapped for Supabase without UI changes. See `docs/ARCHITECTURE.md`.

## How to add a provider

1. Create `packages/core/src/providers/<name>.ts` exporting one `MODEL` constant and a `Provider` object (`id`, `name`, `model`, `generate(req, prompt, apiKey)`), returning a base64 data URL.
2. Register it in `packages/core/src/providers/index.ts`.
3. Map its env key in `apps/web/lib/credits.ts` (`serverKeyFor`).
4. Add the env var to `.env.example`.

That's it — the Studio provider dropdown and `/api/generate` pick it up automatically.

## Self-hosting

```bash
npm install && npm run build
npm run start --workspace @reno/web
```

Set env keys for hosted-style credits, or set nothing and let everyone use their own key. Reno is MIT licensed — run it anywhere, free forever.

## Docs

- `docs/PRODUCT.md` — canonical product definition
- `docs/PRODUCT_PLAN.md` — roadmap and data model
- `docs/ARCHITECTURE.md` — system design and migration paths
- `docs/CODING_STANDARDS.md` — how we write code here
- `docs/DESIGN_REFERENCES.md` — design principles
