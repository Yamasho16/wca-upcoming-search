import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { syncUpcomingCompetitions } from "@/lib/sync";

export const runtime = "nodejs";

function isAuthorized(request: NextRequest): boolean {
  if (!env.syncSecret) {
    throw new Error("SYNC_API_SECRET is not configured.");
  }

  const headerSecret = request.headers.get("x-sync-secret");
  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const querySecret = request.nextUrl.searchParams.get("secret");

  return [headerSecret, bearerToken, querySecret].includes(env.syncSecret);
}

async function handleSync(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pageRaw = request.nextUrl.searchParams.get("page");
    const offsetRaw = request.nextUrl.searchParams.get("offset");
    const chunkSizeRaw = request.nextUrl.searchParams.get("chunkSize");
    const finalizeRaw = request.nextUrl.searchParams.get("finalize");
    const finalizeOnlyRaw = request.nextUrl.searchParams.get("finalizeOnly");
    const page = pageRaw ? Number(pageRaw) : 1;
    const offset = offsetRaw ? Number(offsetRaw) : 0;
    const chunkSize = chunkSizeRaw ? Number(chunkSizeRaw) : undefined;

    if (!Number.isInteger(page) || page < 1) {
      return NextResponse.json({ error: "page must be an integer >= 1." }, { status: 400 });
    }

    if (!Number.isInteger(offset) || offset < 0) {
      return NextResponse.json({ error: "offset must be an integer >= 0." }, { status: 400 });
    }

    if (typeof chunkSize === "number" && (!Number.isInteger(chunkSize) || chunkSize < 1)) {
      return NextResponse.json({ error: "chunkSize must be an integer >= 1." }, { status: 400 });
    }

    const summary = await syncUpcomingCompetitions({
      page,
      offset,
      chunkSize,
      finalize: finalizeRaw === "1" || finalizeRaw === "true",
      finalizeOnly: finalizeOnlyRaw === "1" || finalizeOnlyRaw === "true",
    });

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected sync error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
