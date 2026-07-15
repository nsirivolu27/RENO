# Reno — Coding Standards

## Principles

- **KISS.** The simplest implementation that satisfies the product doc wins. No speculative abstraction, no config for things that never vary.
- **DRY with restraint.** Extract shared code when the third copy appears or when the duplication is a correctness risk (e.g. prompt rules, storage keys). Two similar-looking blocks that evolve independently may stay separate.

## TypeScript

- Strict mode everywhere (`tsconfig.base.json`); no `any`, no `@ts-ignore` without a comment explaining why.
- Use `import type { … }` for type-only imports.
- Narrow `unknown` at boundaries (API bodies, JSON imports, provider responses) with explicit checks — never cast user input straight to a domain type.
- Public functions in `packages/core` get doc comments.

## UI

- Plain CSS in `apps/web/app/globals.css`. **No Tailwind, no UI frameworks, no CSS-in-JS.**
- Dark theme via CSS variables; constrained layouts; stable dimensions (reserve space for async content); readable controls with real `<label>`s and aria attributes.
- Every async surface has explicit empty, loading, and error states.

## Provider isolation

- Providers live only in `packages/core/src/providers/`, one file each, exactly one exported `MODEL` constant at the top.
- Providers receive `(req, prompt, apiKey)` and return a data URL. They never read env vars, never touch cookies/credits, and never import from `apps/*`.

## Validation rules

- Every image entering the system is validated as a base64 data URL via `dataUrlParts` — server-side, before any key or credit logic.
- API route: validate body shape first, then provider, then key, then credits, then generate. Fail with a JSON `{ error, code }` and the right status (400/402/502).

## Error handling

- User-facing errors are actionable sentences ("Browser storage is full. Export or delete a project…"), not raw exceptions.
- Never spend a credit on a failure. Never swallow provider error details — surface status + message.
- Catch narrowly at boundaries (API route, storage writes, file imports); let unexpected bugs throw in dev.

## File size guidance

- Aim for < ~300 lines per file; a page component may reach ~400 if splitting would hurt cohesion. Beyond that, extract components or helpers.
- One component per file; helpers colocated until shared.
