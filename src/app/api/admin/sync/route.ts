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
    const finalizeRaw = request.nextUrl.searchParams.get("finalize");
    const page = pageRaw ? Number(pageRaw) : 1;

    if (!Number.isInteger(page) || page < 1) {
      return NextResponse.json({ error: "page must be an integer >= 1." }, { status: 400 });
    }

    const summary = await syncUpcomingCompetitions({
      page,
      finalize: finalizeRaw === "1" || finalizeRaw === "true",
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
