# Reno Product Plan

## Product Spine

Reno serves two workflows through the same rendering engine:

- Quick Design: homeowners, renters, office managers, and real-estate users upload a space photo and explore redesign options quickly.
- Client Demo Projects: renovators, designers, and contractors package client spaces, design direction, and generated concepts into a reusable demo.

The professional workflow should wrap Studio without making the simple homeowner path heavier.

## Design Direction Hierarchy

Generation direction should resolve in this order:

1. Custom project or design-pack direction.
2. Built-in style preset.
3. Session notes.

Provider adapters stay unaware of projects, clients, brands, and design packs. They receive only the final request, prompt, and key.

## Local-First Data Model

The first project layer uses browser storage:

- `DemoProject`: project name, optional client name, room, notes, preferred styles, design direction, render list.
- `ProjectRender`: before/after images, style, mode, notes, provider/model, favorite flag, timestamp.
- `ProjectStore`: storage boundary so Supabase can replace localStorage later without changing UI flow.

## Roadmap

1. Finish and verify MVP render flow.
2. Add local-first professional project/client demos.
3. Persist renders and add public share pages.
4. Add optional Supabase auth and credit storage.
5. Add optional Stripe checkout, subscriptions, and portal.
6. Add importable design packs/custom style libraries.
7. Add free-tier watermarking.
8. Polish Vercel deployment and self-host configuration.

## Definition Of Done For Local Demo Projects

- Create a project with client, room, notes, preferred styles, and design direction.
- Open Studio with the project selected.
- Keep no-project Studio behavior unchanged.
- Append project direction to render notes without touching provider adapters.
- Save successful renders to the project.
- View saved concepts, compare before/after, mark favorites, and export project JSON.
- Keep the feature local-first with no auth, database, Stripe, or new dependencies.
