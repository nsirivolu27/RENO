# Reno — Product Plan

## Two workflows, one engine

The homeowner quick-render flow and the professional demo-project flow share the same generation engine: one prompt builder, one provider interface, one API route. The professional layer only *adds context* (project design direction, preferred styles, save/favorite/present); it never forks the generation path. Any improvement to generation quality benefits both audiences automatically.

## Design direction hierarchy

When a render is generated, direction is composed in this order (most specific last, appended to the prompt):

1. **Mode contract** — restyle vs renovate rules (what may change).
2. **Style preset** — rich materials/palette/lighting prompt from `packages/core/src/styles.ts`.
3. **Render notes** — what the user typed for this specific generation.
4. **Project direction** — the active project's design direction + project notes, appended automatically in Studio.
5. **Architecture lock** — the fixed closing sentence that pins camera angle, dimensions, windows/doors, and photorealism.

## Local-first data model

Projects live entirely in the browser (`localStorage` key `reno_projects`) as `DemoProject[]`:

- `DemoProject`: id, name, clientName?, room, notes?, preferredStyles[], designDirection?, renders[], createdAt, updatedAt.
- `ProjectRender`: id, style, mode, notes?, provider, model, beforeImage, afterImage (both compressed to ≤1600px JPEG q0.82), favorite, createdAt.

Portability is JSON export/import from the Demo View. The `ProjectStore` interface is Promise-based so a hosted Supabase store can replace localStorage without touching UI code.

## Roadmap

1. **Now (MVP, this repo):** Studio + local demo projects + 3 providers + credits stub + mobile prototype.
2. **Next:** Supabase auth + hosted project sync; Stripe credit packs; anonymous-credit merge on signup.
3. **Then:** public share links for demo views; watermarked free renders; batch concept generation.
4. **Later:** team workspaces, brand kits for staging companies, PDF proposal templates.

Every step after "Now" is optional infrastructure — the self-host/BYO path must keep working with none of it.

## Definition of done — local demo projects

- Create a project with name, client, room, notes, preferred styles, and design direction; unnamed projects default to "Untitled demo".
- Open Studio via `?project=<id>`; project context is visible and direction is appended to every generation.
- Save a successful render to the project with compressed before/after images; storage-quota failures give an actionable error.
- Favorite/unfavorite renders from the Demo View.
- Demo View presents title, client, room, direction, preferred styles, and a before/after render gallery; printing hides chrome and yields a clean white-background client proposal with unbroken render cards.
- Export a project as JSON; import it on another device with helpful errors for invalid files.
- Delete a project with confirmation.
