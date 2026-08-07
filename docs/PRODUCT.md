# Reno — Product Definition (canonical)

This document is the source of truth for what Reno is. When code and this document disagree, this document wins.

## What Reno is

Reno is an MIT open-source AI renovation/design demo app. A user uploads a photo of a real residential or corporate space, chooses a room/space type and a design style, and generates a photorealistic redesign of that exact space — same camera angle, same dimensions, same windows and doors, new design.

Two generation modes:

- **Restyle** — replaces furniture, decor, rugs, art, textiles, lighting, and accessories while preserving flooring, walls, fixtures, cabinetry, and built-ins.
- **Renovate** — additionally changes flooring, walls, fixtures, cabinetry, finishes, and built-ins where appropriate.

## The two audiences

**Everyday users.** Homeowners, renters, office managers, real-estate people, and small business owners who want to quickly see what a space could look like. Their flow must stay simple: upload → pick room and style → generate → compare → download. No project machinery in the way.

**Professionals.** Renovators, contractors, interior designers, staging teams, and consultants creating precise, client-ready demos. They create a demo project (client name, space type, preferred styles, design direction/materials/constraints), generate concepts in Studio with that direction applied automatically, save and favorite the strongest renders, and present or export a clean demo view.

## The core principle: two modes, always

1. **Hosted mode** — the server holds provider API keys; users spend free (3) or purchased credits. Credits are checked before generation and spent only after a successful render.
2. **Self-host / BYO-key mode** — the user pastes their own provider key in the browser (stored in localStorage only). BYO renders are free and unlimited, spend no hosted credits, and require zero Stripe, Supabase, auth, or paid Reno services.

Breaking mode 2 is a product regression, full stop.

## Current MVP features

- Studio: drag-drop upload, room/space select (residential + corporate), restyle/renovate toggle, 10-style grid, notes, provider dropdown (Demo / Gemini / OpenAI / Replicate), BYO key input, credits badge, before/after slider, download, regenerate, and a "Use Demo provider" fallback when a real provider has no key or hits quota.
- Demo provider: a built-in, no-key provider that returns a clearly-labeled SVG concept board (never presented as real AI output). It's the default so the whole flow can be demoed with zero paid services.
- Demo projects (local-first, in localStorage): create with client name/room/notes/preferred styles/design direction; renders saved with compressed before/after images; favorite toggles; JSON export/import; print-friendly demo view for client proposals.
- Public sharing: from a project's Demo View, publish a server-side snapshot and get a public `/r/:shareId` page (favorites first, before/after, "Made with Reno"). Update or disable the share anytime.
- API: `GET /api/generate` (credits + provider availability), `POST /api/generate` (validation, provider resolution, key resolution, credit semantics); plus the server project/share APIs (see `docs/BACKEND.md`).
- Mobile prototype: camera/library capture, room/style chips, optional Gemini key, generate against the web API, tap to flip before/after.

## Business logic

- Free tier: 3 hosted renders per anonymous visitor (httpOnly cookie `reno_visitor`).
- Credit packs: $9 per 30 renders (Stripe — not yet wired; stub documents the path).
- Self-host: free forever, MIT, BYO keys.
- A credit is never spent on a failed generation. BYO-key renders never spend credits.

## MVP user flows

1. **Homeowner:** land → Studio → upload photo → pick "living room" + "Japandi" → Generate → drag slider → Download. Zero setup, three free tries.
2. **Professional:** Projects → create "Maple St refresh" for The Novaks with design direction → Open Studio (project context shows, direction auto-applies) → generate → Save to project → repeat with other styles → Demo View → favorite the best two → Print to PDF for the client meeting, or Export JSON.
3. **Self-hoster:** clone repo → `npm install && npm run dev` → paste own Gemini key in Studio → unlimited renders, no accounts.

## Future product layers (explicitly not built yet)

- Auth + Supabase persistence (projects sync across devices; anonymous credit merge on signup). Public shares currently publish a server snapshot scoped to the `reno_visitor` cookie, not an authenticated account.
- Stripe checkout + webhook credit top-ups.
- Watermarked free renders.
- Batch concept generation ("3 concepts at once") — today, multiple concepts = generate → save → repeat.
- Team workspaces for staging companies.

Each layer must remain optional and env-driven so self-host stays zero-service.
