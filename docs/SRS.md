# Reno Software Requirements Specification

## Purpose

Reno helps users create photorealistic redesign previews for residential and corporate spaces from a single uploaded photo.

## Audiences

- Homeowners and renters exploring room redesign ideas.
- Renovators, contractors, and interior designers creating custom visual demos for clients.
- Self-hosters who want an MIT-licensed renovation tool that works with their own provider keys.

## MVP Scope

- Upload a room or space photo.
- Select room type, style preset, render mode, provider, and optional notes.
- Generate a photorealistic redesign.
- Compare before and after with a draggable slider.
- Download the generated result.
- Use hosted free credits or BYO provider keys.
- Run without Stripe, Supabase, or paid Reno services.

## Out of Scope for Step 1

- User accounts.
- Paid checkout.
- Persisted render galleries.
- Contractor/client workspaces.
- Public share pages.
- Watermarking.

## Future Scope

- Renovator accounts with client projects.
- Custom design variety libraries per professional or company.
- Open renovation/design data integrations for non-custom styles.
- Saved renders and public before/after pages.
- Stripe credit packs and subscriptions.
- Supabase-backed auth and credits.

## Non-Functional Requirements

- TypeScript strict mode.
- Minimal dependencies.
- Provider models must be easy to swap through one exported `MODEL` constant per provider file.
- API keys supplied by users are stored only in browser localStorage and sent directly to the generation API for that request.
- Self-host and BYO-key flows must remain functional without Reno paid services.
