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

const before = await request("/api/generate");
assert(before.res.status === 200, "provider/credits bootstrap failed");
const startCredits = before.body.credits;
assert(
  before.body.providers?.some((p) => p.id === "demo" && p.configured === true),
  "demo provider should always be configured"
);

const generated = await request("/api/generate", {
  method: "POST",
  body: JSON.stringify({
    image: pixel,
    style: "japandi",
    room: "living room",
    mode: "renovate",
    notes: "keep the layout, add warm hidden storage",
    provider: "demo",
  }),
});

assert(generated.res.status === 200, "demo generation failed");
assert(generated.body.provider === "demo", "demo provider id missing");
assert(generated.body.model === "demo-placeholder-v1", "demo model mismatch");
assert(
  typeof generated.body.image === "string" &&
    generated.body.image.startsWith("data:image/svg+xml;base64,"),
  "demo generation did not return an SVG data URL"
);
assert(
  generated.body.credits === startCredits,
  "demo generation should not spend free credits"
);

console.log(
  JSON.stringify(
    {
      ok: true,
      base,
      provider: generated.body.provider,
      model: generated.body.model,
      credits: generated.body.credits,
    },
    null,
    2
  )
);
