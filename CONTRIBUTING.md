# Contributing to Reno

Thanks for helping! Before you write code:

1. Read [docs/PRODUCT.md](docs/PRODUCT.md) — it is the canonical definition of what Reno is and who it serves. PRs that fight the product definition will be asked to align with it first.
2. Read [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## The one non-negotiable

**Preserve the BYO-key / self-host path.** A user with only their own provider API key — no Stripe, no Supabase, no auth, no paid Reno services — must always be able to run Reno and generate unlimited renders. Any change that makes hosted infrastructure mandatory will be rejected. Hosted/paid features must stay optional and env-driven.

## Workflow

- Fork, branch, and open a PR against `main`. No force pushes to shared branches.
- Run `npm run typecheck` and `npm run build` before opening a PR.
- Keep dependencies minimal; justify any new one in the PR description.
- No Tailwind or UI frameworks in `apps/web` — plain CSS only.
- New providers go behind the `Provider` interface in `packages/core` (see README "How to add a provider").
