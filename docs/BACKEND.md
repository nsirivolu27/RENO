# Reno — Backend / Server Project API

Notes for the server-side project store: the routes, env vars, error codes, and
curl smoke tests. This is the hosted/self-host file-backed API. The BYO-key
render path (`/api/generate`) and the browser's local-first project store are
independent of this and must keep working with none of it configured.

## Architecture (server projects)

```
Route handlers (app/api/**)         thin: parse body, call repo, respond
  → lib/apiResponse.ts              responderFor(req) + storeError() mapping
  → lib/projectSchema.ts            readJsonObject(), readFavorite()
  → lib/projectRepository.ts        ProjectRepository interface (migration seam)
      → lib/serverProjects.ts       file-backed implementation (JSON on disk)
```

Routes depend on the `ProjectRepository` interface, not on the file store
directly. To move to a hosted database later, implement `ProjectRepository`
once and return it from `getProjectRepository()`; the routes don't change and
the file store stays the zero-dependency default.

## Environment variables

| Var | Default | Purpose |
| --- | --- | --- |
| `RENO_DATA_DIR` | `<cwd>/.reno-data` | Directory for `projects.json`. Set this to a persistent path in production. |
| `RENO_MAX_PROJECTS_PER_VISITOR` | `100` | Cap on projects per visitor cookie. Must be a positive integer or the default applies. |
| `RENO_MAX_RENDERS_PER_PROJECT` | `80` | Cap on renders stored per project (also applied when importing). |

Identity is the `reno_visitor` httpOnly cookie (see `lib/credits.ts`). All
project ownership is scoped to that cookie — there is no auth yet.

## Routes

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/health` | Liveness + which providers have server keys + storage mode. |
| GET | `/api/projects` | List this visitor's projects. |
| POST | `/api/projects` | Create a project. |
| POST | `/api/projects/import` | Import a project export (validates renders' data URLs). |
| GET/PATCH/DELETE | `/api/projects/:id` | Read / update / delete a single owned project. |
| POST | `/api/projects/:id/renders` | Append a render (before/after data URLs required). |
| PATCH/DELETE | `/api/projects/:id/renders/:renderId` | Toggle/set favorite / delete a render. |
| GET/POST/DELETE | `/api/projects/:id/share` | Read / enable / disable a public share link. |
| GET | `/api/share/:shareId` | Public, unauthenticated read of a shared project. |

### Public sharing model (local → server snapshot)

Projects are local-first (browser `localStorage`). Public pages are served from
the file store, so the UI "Create public share" action **publishes a snapshot**:
`POST /api/projects/import` (server validates + stores a copy) then
`POST /api/projects/:id/share` (mints a `shareId`). The returned pointer
(`shareId`, `serverProjectId`, url) is saved back onto the local project so the
UI can show live status, re-publish ("Update snapshot"), or disable. Disabling
deletes the share and the server snapshot copy. Render images may be
`image/svg+xml` data URLs (the Demo provider's output), which `dataUrlParts`
accepts; SVGs are only rendered inside `<img>`, so no script execution.

### Error codes

`PROJECT_NOT_FOUND` (404), `RENDER_NOT_FOUND` (404), `PROJECT_LIMIT_REACHED`
(400), `RENDER_LIMIT_REACHED` (400), `INVALID_IMAGE` (400), `INVALID_PROJECT`
(400), `INVALID_BODY` (400), `SHARE_NOT_FOUND` (404). All are mapped centrally
in `lib/apiResponse.ts`.

## Smoke test

With the dev server running, execute:

```bash
npm run smoke:demo
npm run smoke:backend
```

`smoke:demo` verifies the no-key Demo provider path for `/api/generate` and
confirms it does not spend credits. This is the fastest end-to-end check for
contributors who do not have Gemini, OpenAI, or Replicate credentials.

Set `RENO_SMOKE_BASE_URL` to target a deployed environment instead of local dev.
The script runs health, create, patch, render save, favorite, share enable,
public API fetch, public `/r/:shareId` page fetch, share disable,
404-after-disable, and project delete.

For error paths, run:

```bash
npm run smoke:negatives
```

It checks: malformed JSON body (400 `INVALID_BODY`), non-object body (400
`INVALID_BODY`), unknown project GET/PATCH/DELETE (404 `PROJECT_NOT_FOUND`),
unknown public share (404 `SHARE_NOT_FOUND`), render with invalid/missing images
(400 `INVALID_IMAGE`), favorite/delete of an unknown render (404
`RENDER_NOT_FOUND`), a disabled share returning 404, and the project/render
capacity limits. The limit checks use throwaway visitor cookies and delete
everything they create; if the server's cap is above the probe count they print
a skip note asking you to re-run with a small `RENO_MAX_*` value. `npm run smoke`
runs the demo generate path, the happy path, and the negatives back to back.

## Curl smoke test

Runs create → add render → enable share → fetch public share → disable share →
delete project. A 1x1 PNG data URL is used as a stand-in for before/after
images. Run against a dev server (`npm run dev`).

```bash
BASE=http://localhost:3000
JAR=$(mktemp)                    # cookie jar keeps the reno_visitor identity
PNG="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC"

# health
curl -s $BASE/api/health | jq .

# create a project
PID=$(curl -s -c $JAR -b $JAR -X POST $BASE/api/projects \
  -H 'content-type: application/json' \
  -d '{"name":"Smoke test","room":"living room","preferredStyles":["japandi"]}' \
  | jq -r '.project.id')
echo "project: $PID"

# add a render
curl -s -c $JAR -b $JAR -X POST $BASE/api/projects/$PID/renders \
  -H 'content-type: application/json' \
  -d "{\"style\":\"japandi\",\"mode\":\"restyle\",\"beforeImage\":\"$PNG\",\"afterImage\":\"$PNG\"}" \
  | jq '.render.id'

# enable share, capture the shareId
SHARE=$(curl -s -c $JAR -b $JAR -X POST $BASE/api/projects/$PID/share | jq -r '.shareId')
echo "share: $SHARE"

# public fetch (no cookie needed)
curl -s $BASE/api/share/$SHARE | jq '.project.name, .shareId'

# disable share, then confirm the public link 404s
curl -s -c $JAR -b $JAR -X DELETE $BASE/api/projects/$PID/share > /dev/null
curl -s -o /dev/null -w "after disable: %{http_code}\n" $BASE/api/share/$SHARE

# delete the project
curl -s -c $JAR -b $JAR -X DELETE $BASE/api/projects/$PID | jq .
```

Expected: health `ok:true`; a project id; a render id; the public fetch returns
the project name and shareId; after disable the public link returns `404`; the
delete returns `{"ok":true}`.

### Negative checks

```bash
# malformed JSON -> 400 INVALID_BODY
curl -s -X POST $BASE/api/projects -H 'content-type: application/json' -d '{' | jq .

# unknown project -> 404 PROJECT_NOT_FOUND
curl -s $BASE/api/projects/does-not-exist | jq .

# render with a non-data-URL image -> 400 INVALID_IMAGE
curl -s -c $JAR -b $JAR -X POST $BASE/api/projects/$PID/renders \
  -H 'content-type: application/json' \
  -d '{"beforeImage":"nope","afterImage":"nope"}' | jq .
```
