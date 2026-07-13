# Reno

Reno is an MIT-licensed AI renovation app. Upload a photo of a residential or corporate space, choose a style, and generate a photorealistic restyle or renovation with hosted credits or your own API key.

It is built for two audiences: homeowners and teams who want fast visual exploration, and renovators or interior designers who need more precise client demos with custom design direction.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. To use hosted rendering, configure one or more server keys in `apps/web/.env.local`:

```bash
GEMINI_API_KEY=...
OPENAI_API_KEY=...
REPLICATE_API_TOKEN=...
DEFAULT_PROVIDER=gemini
FREE_CREDITS=3
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

The open-core path is always available: users can paste their own provider API key in Studio, stored only in browser `localStorage`, and those renders do not spend server credits.

## Architecture

- `packages/core`: shared TypeScript types, prompt presets, prompt builder, and provider adapters.
- `apps/web`: Next.js 15 App Router web studio and `/api/generate`.
- `apps/mobile`: Expo SDK 52 mobile prototype calling the same web API.

Credits are intentionally a freemium stub in `apps/web/lib/credits.ts`: anonymous visitors get `FREE_CREDITS` via an httpOnly cookie and an in-memory `Map`.

Future professional workflows can layer in client projects, contractor branding, custom design libraries, and open renovation/design data integrations while preserving the same provider interface.

Planning docs:

- `docs/SRS.md`
- `docs/USER_FLOWS.md`
- `docs/ARCHITECTURE.md`
- `docs/CODING_STANDARDS.md`

## Add a Provider

1. Add `packages/core/src/providers/new-provider.ts`.
2. Export exactly one `MODEL` constant at the top.
3. Implement the `Provider` interface.
4. Register it in `packages/core/src/providers/index.ts`.
5. Add the server env key lookup in `apps/web/app/api/generate/route.ts`.

## Mobile

```bash
npm run mobile
```

Set `API_URL` at the top of `apps/mobile/App.tsx` to your running web app URL.
