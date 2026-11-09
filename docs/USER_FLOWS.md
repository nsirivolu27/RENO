# User Flows

## Homeowner Happy Path

1. User opens Studio.
2. User uploads a room photo.
3. User selects room, mode, and style.
4. User optionally adds notes.
5. User generates with hosted credits or a BYO key.
6. User compares before/after and downloads the result.

## Renovator Demo Path

1. Renovator uploads a client space photo.
2. Renovator chooses the room or area type.
3. Renovator selects a preset or enters project-specific notes.
4. Renovator generates multiple demos for the client.
5. Renovator downloads or later shares the selected render.

## Edge Cases

- Invalid or non-base64 image data returns validation errors.
- No server key and no BYO key returns `NO_API_KEY`.
- Hosted credits exhausted returns HTTP `402` with `NO_CREDITS`.
- BYO-key renders bypass hosted credit spending.
- Provider failures return readable error messages without decrementing credits before generation.

## Future Flows

- Anonymous user signs up, and remaining cookie credits merge into `profiles.credits`.
- User buys a credit pack, Stripe webhook increments credits.
- Pro subscriber receives monthly render credits.
- Renovator saves a project and publishes a client share page.
