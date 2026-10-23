// Negative-path smoke tests for the Reno backend.
//
// Complements scripts/smoke-backend.mjs (happy path). Run against a dev server:
//   npm run dev              # in one terminal
//   npm run smoke:negatives  # in another
// Point at a deployed environment with RENO_SMOKE_BASE_URL.
//
// Covers: invalid JSON body, non-object body, unknown project (404),
// unknown render (404), invalid/missing render images (INVALID_IMAGE),
// public share of an unknown id (404), share disabled -> 404, and the
// project/render capacity limits. The limit checks use their own visitor
// cookies and delete everything they create.

const base = process.env.RENO_SMOKE_BASE_URL || "http://127.0.0.1:3000";
const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC";

// How many creates to attempt before deciding the server cap is "too high to
// probe" and skipping the limit assertion (keeps the test fast + non-polluting).
const PROBE_LIMIT = 12;

function makeJar() {
  return { cookie: "" };
}

async function request(path, init = {}, jar = null) {
  const headers = new Headers(init.headers);
  if (jar && jar.cookie) headers.set("cookie", jar.cookie);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const res = await fetch(`${base}${path}`, { ...init, headers });
  if (jar) {
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      const first = setCookie.split(";")[0];
      jar.cookie = jar.cookie ? `${jar.cookie}; ${first}` : first;
    }
  }
  const text = await res.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }
  return { status: res.status, body };
}

let passed = 0;
function check(name, condition, detail = "") {
  if (!condition) {
    throw new Error(`FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
  }
  passed += 1;
  console.log(`  ok   ${name}`);
}

function codeOf(r) {
  return `${r.status}/${r.body && r.body.code ? r.body.code : "?"}`;
}

// ---- Stateless negatives (create nothing) --------------------------------

const badJson = await request("/api/projects", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: "{ not json",
});
check("malformed JSON body -> 400 INVALID_BODY", badJson.status === 400 && badJson.body.code === "INVALID_BODY", codeOf(badJson));

const arrayBody = await request("/api/projects", {
  method: "POST",
  body: JSON.stringify([1, 2, 3]),
});
check("non-object JSON body -> 400 INVALID_BODY", arrayBody.status === 400 && arrayBody.body.code === "INVALID_BODY", codeOf(arrayBody));

const missingGet = await request("/api/projects/does-not-exist");
check("unknown project GET -> 404 PROJECT_NOT_FOUND", missingGet.status === 404 && missingGet.body.code === "PROJECT_NOT_FOUND", codeOf(missingGet));

const missingPatch = await request("/api/projects/does-not-exist", {
  method: "PATCH",
  body: JSON.stringify({ room: "kitchen" }),
});
check("unknown project PATCH -> 404 PROJECT_NOT_FOUND", missingPatch.status === 404 && missingPatch.body.code === "PROJECT_NOT_FOUND", codeOf(missingPatch));

const missingDelete = await request("/api/projects/does-not-exist", { method: "DELETE" });
check("unknown project DELETE -> 404 PROJECT_NOT_FOUND", missingDelete.status === 404 && missingDelete.body.code === "PROJECT_NOT_FOUND", codeOf(missingDelete));

const missingShare = await request("/api/share/does-not-exist");
check("unknown public share -> 404 SHARE_NOT_FOUND", missingShare.status === 404 && missingShare.body.code === "SHARE_NOT_FOUND", codeOf(missingShare));

// ---- Negatives that need a project ---------------------------------------

const jar = makeJar();
const project = await request("/api/projects", {
  method: "POST",
  body: JSON.stringify({ name: "Negatives", room: "living room" }),
}, jar);
check("setup: create project", project.status === 201 && project.body.project, codeOf(project));
const pid = project.body.project.id;

try {
  const badImage = await request(`/api/projects/${pid}/renders`, {
    method: "POST",
    body: JSON.stringify({ style: "japandi", mode: "restyle", beforeImage: "nope", afterImage: "nope" }),
  }, jar);
  check("render with non-data-URL images -> 400 INVALID_IMAGE", badImage.status === 400 && badImage.body.code === "INVALID_IMAGE", codeOf(badImage));

  const missingImage = await request(`/api/projects/${pid}/renders`, {
    method: "POST",
    body: JSON.stringify({ style: "japandi", mode: "restyle" }),
  }, jar);
  check("render with missing images -> 400 INVALID_IMAGE", missingImage.status === 400 && missingImage.body.code === "INVALID_IMAGE", codeOf(missingImage));

  const favMissing = await request(`/api/projects/${pid}/renders/nope`, {
    method: "PATCH",
    body: JSON.stringify({ favorite: true }),
  }, jar);
  check("favorite unknown render -> 404 RENDER_NOT_FOUND", favMissing.status === 404 && favMissing.body.code === "RENDER_NOT_FOUND", codeOf(favMissing));

  const delMissing = await request(`/api/projects/${pid}/renders/nope`, { method: "DELETE" }, jar);
  check("delete unknown render -> 404 RENDER_NOT_FOUND", delMissing.status === 404 && delMissing.body.code === "RENDER_NOT_FOUND", codeOf(delMissing));

  // disabled share -> public link 404s
  const enabled = await request(`/api/projects/${pid}/share`, { method: "POST" }, jar);
  check("setup: enable share", enabled.status === 200 && typeof enabled.body.shareId === "string", codeOf(enabled));
  const shareId = enabled.body.shareId;
  await request(`/api/projects/${pid}/share`, { method: "DELETE" }, jar);
  const afterDisable = await request(`/api/share/${shareId}`);
  check("public share after disable -> 404 SHARE_NOT_FOUND", afterDisable.status === 404 && afterDisable.body.code === "SHARE_NOT_FOUND", codeOf(afterDisable));
} finally {
  await request(`/api/projects/${pid}`, { method: "DELETE" }, jar);
}

// ---- Project limit -------------------------------------------------------

{
  const limitJar = makeJar();
  const created = [];
  let hit = false;
  try {
    for (let i = 0; i < PROBE_LIMIT; i += 1) {
      const r = await request("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: `limit-${i}`, room: "living room" }),
      }, limitJar);
      if (r.status === 201) {
        created.push(r.body.project.id);
      } else if (r.status === 400 && r.body.code === "PROJECT_LIMIT_REACHED") {
        hit = true;
        break;
      } else {
        throw new Error(
          `unexpected create response ${codeOf(r)} ${JSON.stringify(r.body)}`
        );
      }
    }
    if (hit) {
      check("project limit enforced -> 400 PROJECT_LIMIT_REACHED", true, `after ${created.length} creates`);
    } else {
      console.log(`  skip project limit: server cap > ${PROBE_LIMIT}. Re-run dev with RENO_MAX_PROJECTS_PER_VISITOR=3 to exercise it.`);
    }
  } finally {
    for (const id of created) {
      await request(`/api/projects/${id}`, { method: "DELETE" }, limitJar);
    }
  }
}

// ---- Render limit --------------------------------------------------------

{
  const renderJar = makeJar();
  const proj = await request("/api/projects", {
    method: "POST",
    body: JSON.stringify({ name: "render-limit", room: "living room" }),
  }, renderJar);
  check("setup: project for render limit", proj.status === 201 && proj.body.project, codeOf(proj));
  const rpid = proj.body.project.id;
  let hit = false;
  try {
    for (let i = 0; i < PROBE_LIMIT; i += 1) {
      const r = await request(`/api/projects/${rpid}/renders`, {
        method: "POST",
        body: JSON.stringify({ style: "japandi", mode: "restyle", beforeImage: PNG, afterImage: PNG }),
      }, renderJar);
      if (r.status === 201) {
        continue;
      } else if (r.status === 400 && r.body.code === "RENDER_LIMIT_REACHED") {
        hit = true;
        break;
      } else {
        throw new Error(
          `unexpected render response ${codeOf(r)} ${JSON.stringify(r.body)}`
        );
      }
    }
    if (hit) {
      check("render limit enforced -> 400 RENDER_LIMIT_REACHED", true);
    } else {
      console.log(`  skip render limit: server cap > ${PROBE_LIMIT}. Re-run dev with RENO_MAX_RENDERS_PER_PROJECT=3 to exercise it.`);
    }
  } finally {
    await request(`/api/projects/${rpid}`, { method: "DELETE" }, renderJar);
  }
}

console.log(`\nnegatives: ${passed} checks passed against ${base}`);
