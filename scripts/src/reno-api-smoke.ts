function buildConceptEndpoint(apiBaseUrl: string, projectId?: string): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  return projectId
    ? `${base}/api/projects/${projectId}/concepts`
    : `${base}/api/concepts`;
}

async function main() {
  const origin = (process.env.RENO_WEB_ORIGIN || "http://localhost:80").replace(
    /\/+$/,
    "",
  );

  async function readJson(response: Response): Promise<unknown> {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text.slice(0, 160) };
    }
  }

  if (buildConceptEndpoint("/", "project-1") !== "/api/projects/project-1/concepts") {
    throw new Error("Browser API endpoint resolution is incorrect");
  }
  if (buildConceptEndpoint("/", undefined) !== "/api/concepts") {
    throw new Error("Browser standalone API endpoint resolution is incorrect");
  }

  const healthResponse = await fetch(`${origin}/api/healthz`);
  if (!healthResponse.ok) {
    throw new Error(`Health check failed with ${healthResponse.status}`);
  }

  const invalidRenderResponse = await fetch(
    `${origin}${buildConceptEndpoint("/", undefined)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Reno browser boundary smoke test",
        roomType: "Living room",
        style: "Japandi",
        mode: "renovate",
        sourceImageUrl: "not-an-image",
        brief: {
          furnitureLayout: "",
          lighting: "",
          walls: "",
          flooring: "",
          fixtures: "",
          budget: "",
          mustKeep: "",
        },
      }),
    },
  );
  const invalidRender = (await readJson(invalidRenderResponse)) as {
    code?: string;
    error?: string;
  };

  if (
    invalidRenderResponse.status !== 502 ||
    invalidRender.code !== "INVALID_SOURCE_IMAGE"
  ) {
    throw new Error(
      `Expected structured render validation error, got ${invalidRenderResponse.status} ${JSON.stringify(invalidRender)}`,
    );
  }

  console.log(
    JSON.stringify({
      origin,
      health: "ok",
      endpointResolution: "ok",
      renderErrorPropagation: invalidRender.code,
      message: invalidRender.error,
    }),
  );
}

void main();