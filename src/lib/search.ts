import type {
  CompetitionDocument,
  CompetitionSearchParams,
  CompetitionSearchResult,
} from "@/types/competition";
import { normalizeText } from "@/lib/normalize";

export function parseSearchParams(searchParams: URLSearchParams): CompetitionSearchParams {
  const roundsGteRaw = searchParams.get("roundsGte");
  const roundsGte = roundsGteRaw ? Number(roundsGteRaw) : undefined;

  return {
    location: searchParams.get("location") || undefined,
    country: searchParams.get("country") || undefined,
    region: searchParams.get("region") || undefined,
    eventId: searchParams.get("eventId") || undefined,
    roundsGte: Number.isFinite(roundsGte) ? roundsGte : undefined,
    startFrom: searchParams.get("startFrom") || undefined,
    startTo: searchParams.get("startTo") || undefined,
  };
}

export function matchesCompetitionFilters(
  competition: CompetitionDocument,
  filters: CompetitionSearchParams,
): boolean {
  const locationQuery = normalizeText(
    filters.location || filters.country || filters.region || "",
  );

  if (locationQuery && !competition.searchableLocation.includes(locationQuery)) {
    return false;
  }

  if (filters.startFrom && competition.startDate < filters.startFrom) {
    return false;
  }

  if (filters.startTo && competition.startDate > filters.startTo) {
    return false;
  }

  if (filters.eventId) {
    const roundCount = competition.eventRoundCounts[filters.eventId] || 0;

    if (roundCount === 0) {
      return false;
    }

    if (typeof filters.roundsGte === "number" && roundCount < filters.roundsGte) {
      return false;
    }
  }

  return true;
}

export function toCompetitionSearchResult(
  competition: CompetitionDocument,
): CompetitionSearchResult {
  return {
    competitionId: competition.competitionId,
    name: competition.name,
    startDate: competition.startDate,
    endDate: competition.endDate,
    continent: competition.continent,
    country: competition.country,
    city: competition.city,
    venue: competition.venue,
    url: competition.url,
    eventRoundCounts: competition.eventRoundCounts,
  };
}
