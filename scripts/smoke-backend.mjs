const base = process.env.RENO_SMOKE_BASE_URL || "http://127.0.0.1:3000";
const pixel =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC";

let cookie = "";

function rememberCookie(res) {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return;
  const first = setCookie.split(";")[0];
  cookie = cookie ? `${cookie}; ${first}` : first;
}

async function request(path, init = {}) {
  const headers = new Headers(init.headers);
  if (cookie) headers.set("cookie", cookie);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const res = await fetch(`${base}${path}`, { ...init, headers });
  rememberCookie(res);
  const text = await res.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }
  return { res, body };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const health = await request("/api/health");
assert(health.res.status === 200 && health.body.ok === true, "health failed");

const created = await request("/api/projects", {
  method: "POST",
  body: JSON.stringify({
    name: "Backend smoke",
    clientName: "Smoke Client",
    room: "living room",
    preferredStyles: ["japandi"],
    designDirection: "warm oak, linen, concealed storage",
  }),
});
assert(created.res.status === 201, "project create failed");
const projectId = created.body.project?.id;
assert(typeof projectId === "string", "project id missing");

const patched = await request(`/api/projects/${projectId}`, {
  method: "PATCH",
  body: JSON.stringify({ room: "kitchen", preferredStyles: ["industrial", "bad-style"] }),
});
assert(patched.res.status === 200, "project patch failed");
assert(patched.body.project?.room === "kitchen", "project patch did not update room");
assert(
  patched.body.project?.preferredStyles?.join(",") === "industrial",
  "project patch did not filter styles"
);

const render = await request(`/api/projects/${projectId}/renders`, {
  method: "POST",
  body: JSON.stringify({
    style: "industrial",
    mode: "renovate",
    provider: "smoke",
    model: "test",
    beforeImage: pixel,
    afterImage: pixel,
    notes: "Smoke render",
  }),
});
assert(render.res.status === 201, "render create failed");
const renderId = render.body.render?.id;
assert(typeof renderId === "string", "render id missing");

const favorite = await request(`/api/projects/${projectId}/renders/${renderId}`, {
  method: "PATCH",
  body: JSON.stringify({ favorite: true }),
});
assert(favorite.res.status === 200, "favorite patch failed");
assert(favorite.body.project?.renders?.[0]?.favorite === true, "favorite was not set");

const shareBefore = await request(`/api/projects/${projectId}/share`);
assert(shareBefore.res.status === 200, "share status failed");
assert(shareBefore.body.shared === false, "new project should not be shared");

const share = await request(`/api/projects/${projectId}/share`, { method: "POST" });
assert(share.res.status === 200, "share enable failed");
const shareId = share.body.shareId;
assert(typeof shareId === "string", "share id missing");

const publicApi = await request(`/api/share/${shareId}`);
assert(publicApi.res.status === 200, "public share API failed");
assert(publicApi.body.project?.name === "Backend smoke", "public API returned wrong project");

const publicPage = await request(`/r/${shareId}`);
assert(publicPage.res.status === 200, "public share page failed");
assert(
  typeof publicPage.body.raw === "string" && publicPage.body.raw.includes("Shared Reno demo"),
  "public share page did not render expected content"
);

const disabled = await request(`/api/projects/${projectId}/share`, { method: "DELETE" });
assert(disabled.res.status === 200, "share disable failed");

const afterDisable = await request(`/api/share/${shareId}`);
assert(afterDisable.res.status === 404, "disabled share should return 404");

const deleted = await request(`/api/projects/${projectId}`, { method: "DELETE" });
assert(deleted.res.status === 200 && deleted.body.ok === true, "project delete failed");

console.log(
  JSON.stringify(
    {
      ok: true,
      base,
      projectId,
      renderId,
      shareId,
    },
    null,
    2
  )
);
