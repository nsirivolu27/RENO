// Smoke tests for the catalog/pricing and company-portal surfaces.
//
//   npm run dev                # in one terminal
//   npm run smoke:marketplace  # in another
//
// Covers: catalog browse + filters, concept estimates (restyle vs renovate,
// budget tiers), company creation, draft-vs-published offerings, public
// showcase visibility, and lead capture with owner-only inbox access.

const base = process.env.RENO_SMOKE_BASE_URL || "http://127.0.0.1:3000";

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
  if (!condition) throw new Error(`FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
  passed += 1;
  console.log(`  ok   ${name}`);
}

// ---- Catalog -------------------------------------------------------------

const catalog = await request("/api/catalog");
check("catalog loads", catalog.status === 200 && Array.isArray(catalog.body.items), `${catalog.status}`);
check("catalog has vendors and items", catalog.body.vendors.length > 0 && catalog.body.items.length > 0);

const furnishings = await request("/api/catalog?furnishingsOnly=true");
check(
  "furnishingsOnly excludes construction items",
  furnishings.body.items.every((i) => !i.renovateOnly)
);

const byVendor = await request(`/api/catalog?vendorId=${catalog.body.vendors[0].id}`);
check(
  "vendor filter works",
  byVendor.body.items.every((i) => i.vendorId === catalog.body.vendors[0].id)
);

// ---- Estimates -----------------------------------------------------------

const restyle = await request("/api/estimate", {
  method: "POST",
  body: JSON.stringify({ room: "living room", style: "japandi", mode: "restyle" }),
});
check("restyle estimate returns lines", restyle.status === 200 && restyle.body.estimate.lines.length > 0);
check(
  "restyle excludes surfaces/fixtures/labor",
  restyle.body.estimate.lines.every((l) => !["surfaces", "fixtures", "labor"].includes(l.category))
);
check("estimate is caveated", restyle.body.estimate.notes.some((n) => n.includes("not a quote")));

const renovate = await request("/api/estimate", {
  method: "POST",
  body: JSON.stringify({ room: "kitchen", style: "japandi", mode: "renovate" }),
});
check(
  "renovate includes construction categories",
  renovate.body.estimate.lines.some((l) => l.category === "surfaces")
);
check(
  "renovate costs more than restyle",
  renovate.body.estimate.subtotalHigh > restyle.body.estimate.subtotalHigh,
  `${renovate.body.estimate.subtotalHigh} vs ${restyle.body.estimate.subtotalHigh}`
);

const essential = await request("/api/estimate", {
  method: "POST",
  body: JSON.stringify({ room: "living room", style: "japandi", mode: "restyle", tier: "essential" }),
});
const premium = await request("/api/estimate", {
  method: "POST",
  body: JSON.stringify({ room: "living room", style: "japandi", mode: "restyle", tier: "premium" }),
});
check(
  "budget tiers are ordered",
  essential.body.estimate.subtotalHigh <= premium.body.estimate.subtotalHigh
);

const badEstimate = await request("/api/estimate", {
  method: "POST",
  body: JSON.stringify({ room: "living room" }),
});
check("estimate validates input", badEstimate.status === 400 && badEstimate.body.code === "INVALID_REQUEST");

// ---- Company portal ------------------------------------------------------

const owner = makeJar();
const stranger = makeJar();
const suffix = Date.now().toString(36);

const company = await request(
  "/api/companies",
  {
    method: "POST",
    body: JSON.stringify({
      name: `Smoke Interiors ${suffix}`,
      trade: "interior_design",
      tagline: "Smoke test studio",
      contactEmail: "smoke@example.com",
    }),
  },
  owner
);
check("company created", company.status === 201 && company.body.company?.id, `${company.status}`);
const companyId = company.body.company.id;
const slug = company.body.company.slug;

const offering = await request(
  `/api/companies/${companyId}/offerings`,
  {
    method: "POST",
    body: JSON.stringify({
      title: "Living room refresh",
      room: "living room",
      style: "japandi",
      mode: "restyle",
      inclusions: ["Sofa", "Rug", "Lighting"],
      priceLow: 4200,
      priceHigh: 7800,
    }),
  },
  owner
);
check("offering created as draft", offering.status === 201 && offering.body.offering.status === "draft");

const publicList = await request(`/api/companies/${companyId}/offerings`, {}, stranger);
check("drafts hidden from non-owners", publicList.body.offerings.length === 0);

const ownerList = await request(`/api/companies/${companyId}/offerings`, {}, owner);
check("owner sees drafts", ownerList.body.offerings.length === 1 && ownerList.body.canEdit === true);

const offeringId = offering.body.offering.id;

// A non-owner must not be able to publish someone else's offering.
const hijack = await request(
  `/api/companies/${companyId}/offerings/${offeringId}`,
  { method: "PATCH", body: JSON.stringify({ status: "published" }) },
  stranger
);
check("non-owner cannot edit an offering", hijack.status === 404, `${hijack.status}`);

const publish = await request(
  `/api/companies/${companyId}/offerings/${offeringId}`,
  { method: "PATCH", body: JSON.stringify({ status: "published" }) },
  owner
);
check("owner publishes offering", publish.status === 200 && publish.body.offering.status === "published");

const nowPublic = await request(`/api/companies/${companyId}/offerings`, {}, stranger);
check("published offering is publicly visible", nowPublic.body.offerings.length === 1);

const unpublish = await request(
  `/api/companies/${companyId}/offerings/${offeringId}`,
  { method: "PATCH", body: JSON.stringify({ status: "draft" }) },
  owner
);
check("owner can unpublish", unpublish.body.offering.status === "draft");
const hiddenAgain = await request(`/api/companies/${companyId}/offerings`, {}, stranger);
check("unpublished offering disappears publicly", hiddenAgain.body.offerings.length === 0);

// Republish so the showcase has something to render.
await request(
  `/api/companies/${companyId}/offerings/${offeringId}`,
  { method: "PATCH", body: JSON.stringify({ status: "published" }) },
  owner
);

const showcase = await request(`/c/${slug}`);
check("public showcase page renders", showcase.status === 200);

const profileUpdate = await request(
  `/api/companies/${companyId}`,
  { method: "PATCH", body: JSON.stringify({ tagline: "Updated tagline" }) },
  owner
);
check("owner updates company profile", profileUpdate.status === 200 && profileUpdate.body.company.tagline === "Updated tagline");

const profileHijack = await request(
  `/api/companies/${companyId}`,
  { method: "PATCH", body: JSON.stringify({ tagline: "hijacked" }) },
  stranger
);
check("non-owner cannot edit the profile", profileHijack.status === 404);

// ---- Leads ---------------------------------------------------------------

const lead = await request(
  `/api/companies/${companyId}/leads`,
  {
    method: "POST",
    body: JSON.stringify({ name: "Dana Reed", email: "dana@example.com", message: "1990s kitchen" }),
  },
  stranger
);
check("anyone can submit a lead", lead.status === 201 && lead.body.ok === true);
check("lead response does not echo details", lead.body.name === undefined);

const badLead = await request(
  `/api/companies/${companyId}/leads`,
  { method: "POST", body: JSON.stringify({ name: "No Contact" }) },
  stranger
);
check("lead requires a contact method", badLead.status === 400);

const inbox = await request(`/api/companies/${companyId}/leads`, {}, owner);
check("owner reads the lead inbox", inbox.status === 200 && inbox.body.leads.length >= 1);

const stolen = await request(`/api/companies/${companyId}/leads`, {}, stranger);
check("lead inbox is owner-only", stolen.status === 404, `${stolen.status}`);

const leadId = inbox.body.leads[0].id;
const moved = await request(
  `/api/companies/${companyId}/leads/${leadId}`,
  { method: "PATCH", body: JSON.stringify({ status: "contacted" }) },
  owner
);
check("owner advances a lead", moved.status === 200 && moved.body.lead.status === "contacted");

const badStatus = await request(
  `/api/companies/${companyId}/leads/${leadId}`,
  { method: "PATCH", body: JSON.stringify({ status: "banana" }) },
  owner
);
check("lead status is validated", badStatus.status === 400);

const leadHijack = await request(
  `/api/companies/${companyId}/leads/${leadId}`,
  { method: "PATCH", body: JSON.stringify({ status: "won" }) },
  stranger
);
check("non-owner cannot move a lead", leadHijack.status === 404);

console.log(`\nmarketplace: ${passed} checks passed against ${base}`);
