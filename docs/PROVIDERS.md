# Providers: getting real photoreal output

Reno ships four providers. Only one needs no account.

| Provider | Model | Key needed | Notes |
| --- | --- | --- | --- |
| Demo | `demo-placeholder-v1` | none | Local SVG concept board, clearly labeled. Never presented as AI output. |
| Gemini | `gemini-2.5-flash-image` | `GEMINI_API_KEY` or BYO | Cheapest real option **if** your project has image quota. |
| OpenAI | `gpt-image-1` | `OPENAI_API_KEY` or BYO | Highest fidelity for interiors; account must be verified. |
| Replicate | `black-forest-labs/flux-kontext-pro` | `REPLICATE_API_TOKEN` or BYO | Good edit-fidelity; needs a card on file. |

Keys pasted in Studio are stored only in your browser (`reno_key`) and never
spend hosted credits. Server keys go in `.env` (see `.env.example`).

## "It says quota exceeded" — the Gemini 0/0 case

Google frequently provisions **zero quota for image models** on free API keys.
The key authenticates fine, then image generation fails with
`RESOURCE_EXHAUSTED`. This is an account limit, not a Reno bug — Reno now
detects it and says so, and offers a one-click fall back to the Demo provider.

To fix it properly, pick one:

1. **Enable billing** on the Google Cloud / AI Studio project behind the key,
   then confirm the image model shows non-zero quota.
2. **Use OpenAI** — create a key at platform.openai.com, add credit, and
   complete organization verification (required for `gpt-image-1`).
3. **Use Replicate** — create a token at replicate.com, add a payment method.
   Billed per prediction; no monthly minimum.

## Choosing a provider for client work

- **Presenting concepts to a paying client:** OpenAI or Replicate. Both hold
  room geometry well and produce material detail that survives being printed.
- **Fast internal iteration:** Gemini (when quota exists) — quickest and
  cheapest per render.
- **Pitching / testing the workflow, no spend:** Demo provider. Use it to show
  the process; never present the placeholder as a finished concept.

## Cost control

- Every render is one provider call. There is no batch mode yet — multiple
  concepts means generate → save → repeat.
- BYO-key renders are billed by your provider directly, not by Reno.
- Hosted-mode credits (`FREE_CREDITS`, default 3) are only consumed when the
  **server's** key is used, and only after a render succeeds.

## Prompt behavior

`buildPrompt()` in `packages/core/src/styles.ts` composes: mode contract
(restyle keeps built surfaces; renovate may change them) → style preset →
your notes → project design direction → output constraints (no people, text,
logos, or watermarks) → the architecture lock that pins camera angle, room
dimensions, and window/door positions.

If renders drift from the room's real geometry, that's usually the provider,
not the prompt — try OpenAI or Replicate before editing prompts.

## Adding another provider

See the "How to add a provider" section in `README.md`. Keep the `demo`
provider registered so the app always runs with zero paid services.
