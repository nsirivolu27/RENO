# Reno — Design References

## The core principle: prove the product is real

Avoid generic "vibe-coded" feature sections — the interchangeable three-icon-card rows, oversized gradient heroes, and marketing fluff that could describe any AI SaaS. Reno's landing and marketing surfaces must show **evidence**:

- Actual before/after render comparisons (real Studio output once available; honest illustrative previews until then — clearly the same room, same architecture, different design).
- The real Studio and project workflow, shown as the concrete steps a professional takes.
- Concrete numbers: "3 free renders", "10 design styles", "client demo projects" — not "blazing fast" or "AI-powered magic".
- Client-demo previews that look like something you'd actually put in front of a client.

Do not copy any external reference assets. No stock screenshots, no borrowed mockups, no traced layouts.

## Visual language

- Dark theme, restrained and product-focused. Background near-black blue-grey (#0f1115), single warm accent (#ff7849) used sparingly — the "no" in the logo, primary actions, active states.
- No purple gradients, no glassmorphism, no nested cards inside cards.
- Constrained max-width layouts (~1080px), generous whitespace, stable dimensions so nothing jumps as content loads.
- Typography: system UI stack, tight headings, dim secondary text (#99a1b3).

## Interaction quality bar

- The before/after slider is the hero interaction — it must feel immediate and work with mouse, touch, and keyboard.
- Every async surface has designed empty, loading, and error states; errors say what to do next.
- The homeowner flow never shows professional machinery unless a project is explicitly active.
- Print output of a demo view is a deliverable, not an afterthought: white background, no chrome, unbroken render cards, final "after" images.
