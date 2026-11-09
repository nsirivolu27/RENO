# Claude Guidance For Reno

Reno is an MIT open-source AI renovation/design demo app. It serves two workflows:

- Everyday users exploring redesign ideas for residential or corporate spaces.
- Renovators, designers, and contractors creating client-ready demo projects.

Read `docs/PRODUCT.md`, `docs/PRODUCT_PLAN.md`, `docs/ARCHITECTURE.md`, and `docs/CODING_STANDARDS.md` before making non-trivial product or architecture changes.

## Working Rules

- Before implementing any non-trivial request, clarify ambiguity and push back if there is a simpler or safer approach.
- Prioritize simplicity and long-term maintainability over cleverness.
- Present tradeoffs when there is a real decision.
- Keep the self-host/BYO-key path working without Stripe, Supabase, or paid Reno services.
- Do not reintroduce `OpenReno`, `@openreno`, or old storage/cookie keys.
- Do not force-push or overwrite Codex work.
- Prefer branch-based work. Current feature work should branch from the latest relevant Reno branch.
- Keep provider HTTP details isolated in `packages/core/src/providers`.
- Keep local project storage behind the `ProjectStore` interface so Supabase can replace it later.

## Coding Rules

- TypeScript strict.
- Use `import type` for type-only imports.
- No Tailwind or UI framework.
- Minimal dependencies.
- Failed renders must not spend credits.
- BYO API key renders must bypass hosted credits.
- Run `npm run typecheck` and `npm run build` before handing off code.

## Review Habit

After implementing, re-read your own diff as an independent reviewer. List problems before fixing anything else.
