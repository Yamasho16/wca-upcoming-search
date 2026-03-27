import { NextRequest, NextResponse } from "next/server";

import { isValidIsoDate } from "@/lib/date";
import { listUpcomingCompetitions } from "@/lib/firestore/competitions";
import {
  matchesCompetitionFilters,
  parseSearchParams,
  toCompetitionSearchResult,
} from "@/lib/search";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const filters = parseSearchParams(request.nextUrl.searchParams);

    if (filters.startFrom && !isValidIsoDate(filters.startFrom)) {
      return NextResponse.json({ error: "Invalid startFrom. Use YYYY-MM-DD." }, { status: 400 });
    }

    if (filters.startTo && !isValidIsoDate(filters.startTo)) {
      return NextResponse.json({ error: "Invalid startTo. Use YYYY-MM-DD." }, { status: 400 });
    }

    if (
      typeof filters.roundsGte === "number" &&
      (!Number.isInteger(filters.roundsGte) || filters.roundsGte < 1)
    ) {
      return NextResponse.json({ error: "roundsGte must be an integer >= 1." }, { status: 400 });
    }

    if (typeof filters.roundsGte === "number" && !filters.eventId) {
      return NextResponse.json(
        { error: "eventId is required when roundsGte is specified." },
        { status: 400 },
      );
    }

    const competitions = await listUpcomingCompetitions();
    const items = competitions
      .filter((competition) => matchesCompetitionFilters(competition, filters))
      .map(toCompetitionSearchResult);

    return NextResponse.json(
      {
        items,
        total: items.length,
        filters,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
