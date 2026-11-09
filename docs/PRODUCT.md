# Reno Product Definition

Reno helps homeowners imagine better spaces and helps renovation professionals turn design ideas into client-ready visual demos.

## What Reno Is

Reno is an MIT open-source AI renovation and design demo app for turning photos of real spaces into photorealistic redesign concepts.

The product has two sides:

## Everyday User Side

For homeowners, renters, office managers, real-estate people, and small business owners.

They use Reno to:

- Upload a photo of a room or space.
- Pick the room type.
- Pick a design style.
- Choose `Restyle` or `Renovate`.
- Add notes like "keep the sofa" or "make it brighter".
- Generate a photorealistic redesign.
- Compare before and after.
- Download the result.

This is the simple "I want to see what my space could look like" flow.

## Professional Renovator And Designer Side

For renovators, contractors, interior designers, staging teams, and design consultants.

They use Reno to:

- Create a client demo project.
- Add client and project details.
- Upload photos of the client's space.
- Add design direction, materials, constraints, and preferred styles.
- Generate concepts for the same space by repeating generate and save.
- Save concepts into the project.
- Favorite the strongest concepts.
- Show a clean client demo view.
- Export and import project JSON.

This is the "I want to sell or explain a renovation idea to a client" flow.

## Current MVP Features

- Landing page for Reno.
- Studio page.
- Photo upload.
- Room selector.
- Restyle / Renovate toggle.
- Ten design style presets.
- Optional notes.
- Provider dropdown.
- BYO API key input.
- Free credit stub.
- Before/after comparison slider.
- Download render.
- Local-first client demo projects.
- Project create/list page.
- Project detail/demo view.
- Project design direction.
- Preferred style selection.
- Save render to project.
- Favorite saved concepts.
- Export/import project JSON.
- Mobile Expo prototype.
- Shared TypeScript core package.
- Provider system for Gemini, OpenAI, and Replicate.

## Business Logic

Reno should always support two usage models:

- Hosted mode: Reno provides server API keys and credits.
- Self-host/BYO-key mode: the user brings their own API key and can run Reno without Stripe, Supabase, or paid Reno services.

The open-source path is central to the product. It keeps Reno useful before payments, auth, and hosted persistence exist.

## MVP User Flows

For a regular user:

1. Open Reno.
2. Go to Studio.
3. Upload a room photo.
4. Choose room, style, and mode.
5. Add optional notes.
6. Generate.
7. Compare before and after.
8. Download.

For a professional:

1. Go to Projects.
2. Create a client demo project.
3. Add client name, room, notes, preferred styles, materials, and design direction.
4. Open Studio from that project.
5. Upload a client space photo.
6. Generate a concept.
7. Save the concept to the project.
8. Repeat generation and saving for additional concepts.
9. Open demo view.
10. Favorite best options.
11. Present, print, export, or import the project.

## Future Product Layers

- Real render persistence.
- Public share pages at `/r/[id]`.
- Client-facing before/after links.
- Supabase auth.
- User profiles.
- Project database.
- Stripe credit packs.
- Pro subscriptions.
- Team and contractor branding.
- Custom design packs.
- Material libraries.
- Free-tier watermarking.
- PDF/client proposal export.
- Multiple spaces per project.
- Comments and approval workflow.
- Vercel deployment config.
