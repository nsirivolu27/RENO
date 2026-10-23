# Deploying Reno (so client share links actually work)

Emailed `/r/:shareId` links only work if Reno runs somewhere your client can
reach, with storage that survives restarts. This is the honest version of what
that takes.

## The two things that break share links

1. **`NEXT_PUBLIC_APP_URL` not set.** Links are built from this. Without it the
   app falls back to the browser origin, so a link copied on your laptop says
   `http://localhost:3000/...` and is useless in an email. The Demo View shows a
   warning when this is the case.
2. **Ephemeral storage.** Projects and shares are stored as JSON on disk under
   `RENO_DATA_DIR` (default `.reno-data/`). On platforms with a read-only or
   temporary filesystem, shares disappear on redeploy or when the instance
   recycles.

Check both at any time with `GET /api/health` — it reports `publicUrl`,
`shareLinksUsable`, `dataDir`, and `storage`.

## Recommended: a small VPS or any host with a persistent disk

Works on Fly.io (with a volume), Render (with a disk), Railway (with a volume),
a DigitalOcean/Hetzner droplet, or your own box.

```bash
git clone https://github.com/nsirivolu27/RENO.git reno
cd reno
npm install
npm run build

# persistent storage + public URL
export RENO_DATA_DIR=/var/lib/reno            # a real, backed-up path
export NEXT_PUBLIC_APP_URL=https://demos.yourcompany.com
export GEMINI_API_KEY=...                     # optional, hosted mode
export FREE_CREDITS=3

npm run start --workspace @reno/web           # serves on :3000
```

Put nginx/Caddy in front for TLS and proxy to `127.0.0.1:3000`.

> `NEXT_PUBLIC_APP_URL` is inlined at **build** time. If you change it, run
> `npm run build` again.

### systemd unit (example)

```ini
[Unit]
Description=Reno
After=network.target

[Service]
WorkingDirectory=/opt/reno
Environment=NODE_ENV=production
Environment=RENO_DATA_DIR=/var/lib/reno
Environment=NEXT_PUBLIC_APP_URL=https://demos.yourcompany.com
ExecStart=/usr/bin/npm run start --workspace @reno/web
Restart=always

[Install]
WantedBy=multi-user.target
```

## Vercel / serverless — read this first

Reno builds and runs fine on Vercel, **but the file-backed project store does
not persist there**: serverless filesystems are ephemeral and not shared between
invocations. Practical effect: a share link may 404 shortly after you create it.

Options if you want Vercel:

- Use it for the marketing/Studio experience and hand clients PDFs instead of
  links, or
- Wait for (or contribute) the Supabase/Postgres `ProjectRepository`
  implementation — the interface in `apps/web/lib/projectRepository.ts` exists
  precisely for this swap, or
- Deploy the app anywhere with a persistent disk (above).

## Environment variables

| Var | Needed for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Correct emailed share links | Build-time. Full origin, no trailing slash. |
| `RENO_DATA_DIR` | Durable projects/shares | Point at a persistent, backed-up path. |
| `RENO_MAX_PROJECTS_PER_VISITOR` | Abuse control | Default 100. |
| `RENO_MAX_RENDERS_PER_PROJECT` | Abuse control | Default 80. |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` / `REPLICATE_API_TOKEN` | Hosted rendering | Optional; BYO-key and Demo work without them. |
| `DEFAULT_PROVIDER` | Provider when client sends none | Defaults to `gemini`. |
| `FREE_CREDITS` | Hosted free renders per visitor | Default 3. |

## Backups

Everything server-side lives in one file: `$RENO_DATA_DIR/projects.json`
(includes shared snapshots and their images as data URLs, so it grows).

```bash
# nightly copy
cp /var/lib/reno/projects.json /backups/reno-$(date +%F).json
```

Client-editable projects still live in the browser (`localStorage`), so tell
users to **Export JSON** from a project they care about, or publish a share
(which puts a server-side copy on disk).

## Post-deploy checklist

```bash
curl -s https://demos.yourcompany.com/api/health | jq
#  shareLinksUsable: true
#  storage: "file:custom", dataDir: "/var/lib/reno"

RENO_SMOKE_BASE_URL=https://demos.yourcompany.com npm run smoke
```

Then: create a project → save a render → **Create public share** → open the link
in a private window (and on your phone) to confirm a client can see it.

## Security notes for real client work

- There is no auth yet. Ownership is an httpOnly `reno_visitor` cookie, and a
  share link is a secret URL — anyone with the link can view that project.
- Share links can be revoked anytime with **Disable share** (deletes the server
  snapshot too).
- Don't put anything in a project you wouldn't email; treat share URLs as
  unlisted, not private.
