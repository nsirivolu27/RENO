import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getProjectRepository } from "@/lib/projectRepository";

export const runtime = "nodejs";

const repo = getProjectRepository();

interface PublicShareRouteContext {
  params: Promise<{ shareId: string }>;
}

// Public, unauthenticated read — no visitor cookie is set here on purpose.
export async function GET(_req: NextRequest, { params }: PublicShareRouteContext) {
  const { shareId } = await params;
  const shared = await repo.getShared(shareId);
  if (!shared) {
    return NextResponse.json(
      { error: "Shared project not found.", code: "SHARE_NOT_FOUND" },
      { status: 404 }
    );
  }
  return NextResponse.json(shared);
}
