## What changed

<!-- One or two sentences. What does this PR do for a user of Reno? -->

## Why

<!-- Link an issue, or explain the problem this solves. -->

## How to verify

```bash
npm run typecheck
npm run build
npm run dev          # then, in another terminal:
npm run smoke
```

<!-- Add manual steps if UI changed, e.g. "Studio → upload → Demo provider → Generate" -->

## Checklist

- [ ] `npm run typecheck` and `npm run build` pass
- [ ] Smoke scripts pass (`npm run smoke`, plus `npm run smoke:demo` if generation changed)
- [ ] The self-host / BYO-key path still works with **no** paid services configured
- [ ] The Demo provider still works with no API key
- [ ] No Tailwind or UI framework added; plain CSS only
- [ ] No new `localStorage` keys beyond `reno_key`, `reno_provider`, `reno_visitor`, `reno_projects`
- [ ] Docs updated (`README.md` / `docs/*`) if behavior changed
