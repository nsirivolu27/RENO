# Coding Standards

## Principles

- KISS: prefer direct, readable code for MVP paths.
- DRY with restraint: abstract only after duplication becomes meaningful.
- SOLID at module boundaries: providers, credits, and future billing/auth services should be replaceable.

## Naming

- React components: `PascalCase`.
- Functions and variables: `camelCase`.
- Environment variables: `UPPER_SNAKE_CASE`.
- Provider ids: lowercase kebab or simple lowercase names.

## Structure

- Keep domain logic in `packages/core` or `apps/web/lib`.
- Keep UI state inside page/client components until it needs reuse.
- Keep provider-specific HTTP details inside provider files.
- Prefer feature folders for future professional workflows: `projects`, `renders`, `billing`, `auth`.

## Validation and Errors

- Validate API inputs at route boundaries.
- Return stable error codes for user-actionable states.
- Do not spend credits before a provider generation succeeds.
- Keep provider error messages readable but avoid logging API keys.

## File Size Guidance

- Split files above roughly 300 lines when there is a natural boundary.
- Extract shared components only after a second real use appears.
- Keep CSS organized by page or component region.
