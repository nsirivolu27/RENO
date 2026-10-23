import path from "node:path";
import { NextResponse } from "next/server";
import { providers } from "@reno/core";
import { serverKeyFor } from "@/lib/credits";

export const runtime = "nodejs";

/**
 * Liveness + deployment diagnostics.
 *
 * `publicUrl` and `shareLinksUsable` exist so you can confirm, from a deployed
 * box, that emailed `/r/:shareId` links will point at the right origin, and
 * that project storage is on a path you control (not an ephemeral container FS).
 */
export async function GET() {
  const dataDir =
    process.env.RENO_DATA_DIR || path.join(process.cwd(), ".reno-data");
  const publicUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
  const localOnly =
    publicUrl === "" ||
    /^https?:\/\/(localhost|127\.|0\.0\.0\.0|\[::1\]|192\.168\.|10\.)/i.test(publicUrl);

  return NextResponse.json({
    ok: true,
    service: "reno-web",
    storage: process.env.RENO_DATA_DIR ? "file:custom" : "file:local",
    dataDir,
    publicUrl: publicUrl || null,
    // False means share links will only work on this machine.
    shareLinksUsable: !localOnly,
    limits: {
      projectsPerVisitor: process.env.RENO_MAX_PROJECTS_PER_VISITOR ?? "100",
      rendersPerProject: process.env.RENO_MAX_RENDERS_PER_PROJECT ?? "80",
    },
    providers: providers.map((provider) => ({
      id: provider.id,
      configured: provider.id === "demo" || Boolean(serverKeyFor(provider.id)),
    })),
  });
}
