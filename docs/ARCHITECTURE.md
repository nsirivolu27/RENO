# Architecture

Reno starts as a modular monolith: one repository, one web API, shared core package, and clear provider boundaries.

## Modules

- `packages/core`: types, prompt builder, style presets, provider interface, provider adapters.
- `apps/web/app`: Next.js pages and API routes.
- `apps/web/lib`: server-side app services such as credits.
- `apps/mobile`: Expo client that calls the web API.

## Data Flow

1. UI collects image, room, style, mode, notes, provider, and optional BYO key.
2. `/api/generate` validates the data URL and provider.
3. API resolves provider key from request first, then server env.
4. Server-key renders check and spend credits.
5. BYO-key renders skip credit spending.
6. Provider returns a generated image data URL.
7. UI displays before/after comparison.

## Provider Boundary

Providers implement:

```ts
generate(req, prompt, apiKey): Promise<GenerateResult>
```

The app should not depend on provider-specific request details outside `packages/core/src/providers`.

## Production Upgrade Path

- Replace in-memory credits with Supabase/Postgres `profiles.credits`.
- Add Supabase auth and merge anonymous cookie credits on signup.
- Add Stripe checkout, webhooks, and customer portal.
- Persist render metadata and images in database/object storage.
- Add public `/r/[id]` share pages and OG image generation.

Self-hosters can disable Supabase and Stripe by leaving those env vars unset.
