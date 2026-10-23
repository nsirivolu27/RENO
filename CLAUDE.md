# CLAUDE.md — working on Reno

Instructions for AI agents (and humans) working in this repo.

## Before major work

- Read `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, and `docs/CODING_STANDARDS.md` before any non-trivial change. `docs/PRODUCT.md` is canonical.
- Ask clarifying questions for non-trivial or ambiguous requests instead of guessing.
- Push back when a simpler approach exists. Prefer deleting code to adding it.

## Hard rules

- The product is **Reno**. Never use the name "OpenReno" anywhere, and never use the `@openreno` package scope — the scope is `@reno`.
- Never use old storage keys (`openreno.*`, `openreno_*`, `or_key`, `or_provider`, `or_visitor`). The only storage keys are `reno_key`, `reno_provider`, `reno_visitor`, `reno_projects`.
- **Preserve the BYO-key / self-host path.** BYO-key renders must stay free, unlimited, and independent of Stripe/Supabase/auth. Hosted features stay optional and env-driven.
- Do not force push.
- No Tailwind, no UI frameworks in `apps/web`. Plain CSS dark theme.
- Providers live only in `packages/core/src/providers/`, one `MODEL` constant at the top of each file.

## Before finishing

- Run `npm run typecheck` and `npm run build`; both must pass.
- Credits semantics: check credits before generation, spend only after success, never for BYO keys.
