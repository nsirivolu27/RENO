# Reno — Architecture

## Shape: modular monolith

One deployable web app plus a shared core package and a thin mobile client. No microservices, no queues, no database — until a feature actually needs them.

```
packages/core        @reno/core (strict TS, zero runtime deps)
  src/types.ts       GenerateRequest/Result, Provider interface, dataUrlParts
  src/styles.ts      style presets, rooms, buildPrompt + architecture lock
  src/projects.ts    DemoProject/ProjectRender model + factories
  src/providers/     gemini, openai, replicate (one MODEL const each)

apps/web             @reno/web (Next.js 15 App Router, plain CSS)
  app/               landing, studio, projects, projects/[id], api/generate
  lib/credits.ts     hosted-mode freemium stub (httpOnly cookie + in-memory Map)
  lib/projectStore.ts local-first ProjectStore (localStorage) + image compression

apps/mobile          @reno/mobile (Expo SDK 52 prototype, single App.tsx)
```

## Ownership

- **packages/core owns** shared types, the prompt model, style presets, the project data model, and all provider implementations. It is runtime-agnostic (fetch/FormData/atob only — no Node-specific APIs) so it runs in Next's server runtime and could run in an edge or worker runtime later.
- **apps/web owns** UI, the API route, credit accounting, cookies, and local storage. Nothing in core knows about HTTP frameworks, cookies, or storage.
- **apps/mobile owns** nothing shared; it is a deliberately standalone prototype that talks to the web API.

## The provider boundary

`Provider` is the only contract: `{ id, name, model, generate(req, prompt, apiKey) }` returning a base64 data URL. The API route resolves a provider by id, resolves a key (BYO from the request, else server env), builds the prompt via `buildPrompt`, and calls `generate`. Adding a provider means one new file in `core/src/providers/`, one registry line, and one env mapping in `lib/credits.ts` — no UI changes.

## ProjectStore migration path

`ProjectStore` is Promise-based even though localStorage is synchronous. That is intentional: a hosted implementation (Supabase: `projects` + `renders` tables, images in Storage buckets) can implement the same interface and be selected by env/auth state. UI code never touches localStorage directly.

## Credits: stub now, real later

`lib/credits.ts` keeps balances in an in-memory Map keyed by an httpOnly visitor cookie (`reno_visitor`). Semantics that must survive the migration to Postgres/Supabase + Stripe webhooks: check before generation, spend only after provider success, and never spend for BYO keys.

## Supabase / Stripe are optional, forever

Hosted-mode conveniences (auth, synced projects, purchased credits) are additive. The BYO-key/self-host path — browser key in `reno_key`, `/api/generate` with `apiKey` in the body — must keep working with zero external services and empty env vars.
