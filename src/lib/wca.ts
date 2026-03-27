import { getContinentFromCountryIso2 } from "@/constants/continents";
import { env } from "@/lib/env";
import { buildSearchableLocation } from "@/lib/normalize";
import type { CompetitionDocument, EventRoundCounts } from "@/types/competition";

type WcaCompetitionSummary = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  country_iso2?: string;
  city?: string;
  cityName?: string;
};

type WcaPublicWcif = {
  name?: string;
  id?: string;
  schedule?: {
    startDate?: string;
    endDate?: string;
    venues?: Array<{
      name?: string;
      cityName?: string;
      countryIso2?: string;
    }>;
  };
  events?: Array<{
    id?: string;
    rounds?: Array<unknown>;
  }>;
};

const countryNames =
  typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

function competitionUrl(competitionId: string): string {
  return `${env.wcaBaseUrl}/competitions/${competitionId}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(url, {
      next: { revalidate: 0 },
      headers: {
        Accept: "application/json",
        "User-Agent": "wca-upcoming-search-mvp",
      },
    });

    if (response.ok) {
      return (await response.json()) as T;
    }

    const shouldRetry = response.status === 429 || response.status >= 500;

    if (!shouldRetry || attempt === maxAttempts) {
      throw new Error(`WCA request failed: ${response.status} ${response.statusText} (${url})`);
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }

  throw new Error(`WCA request failed after retries (${url})`);
}

export async function fetchUpcomingCompetitionSummariesPage(
  startDate: string,
  page: number,
): Promise<WcaCompetitionSummary[]> {
  const url = new URL("/api/v0/competitions", env.wcaBaseUrl);
  url.searchParams.set("start", startDate);
  url.searchParams.set("page", String(page));

  return fetchJson<WcaCompetitionSummary[]>(url.toString());
}

export async function fetchUpcomingCompetitionSummaries(
  startDate: string,
): Promise<WcaCompetitionSummary[]> {
  const items: WcaCompetitionSummary[] = [];
  let page = 1;

  while (true) {
    const pageItems = await fetchUpcomingCompetitionSummariesPage(startDate, page);

    if (pageItems.length === 0) {
      break;
    }

    items.push(...pageItems);

    if (pageItems.length < 25) {
      break;
    }

    page += 1;
  }

  return items;
}

export async function fetchCompetitionPublicWcif(competitionId: string): Promise<WcaPublicWcif> {
  const publicUrl = new URL(`/api/v0/competitions/${competitionId}/wcif/public`, env.wcaBaseUrl);

  try {
    return await fetchJson<WcaPublicWcif>(publicUrl.toString());
  } catch (error) {
    const fallbackUrl = new URL(`/api/v0/competitions/${competitionId}/wcif`, env.wcaBaseUrl);

    return fetchJson<WcaPublicWcif>(fallbackUrl.toString()).catch(() => {
      throw error;
    });
  }
}

export function extractEventRoundCounts(wcif: WcaPublicWcif): EventRoundCounts {
  const events = wcif.events || [];

  return events.reduce<EventRoundCounts>((accumulator, event) => {
    if (!event.id) {
      return accumulator;
    }

    accumulator[event.id] = Array.isArray(event.rounds) ? event.rounds.length : 0;
    return accumulator;
  }, {});
}

export function buildCompetitionDocumentFromWca(
  summary: WcaCompetitionSummary,
  wcif: WcaPublicWcif,
  syncedAt: string,
): CompetitionDocument {
  const venue = wcif.schedule?.venues?.[0];
  const countryIso2 = venue?.countryIso2 || summary.country_iso2 || "";
  const continent = getContinentFromCountryIso2(countryIso2);
  const country = countryIso2 ? countryNames?.of(countryIso2) || countryIso2 : "Unknown";
  const city = venue?.cityName || summary.cityName || summary.city || "";
  const venueName = venue?.name || "";
  const eventRoundCounts = extractEventRoundCounts(wcif);

  return {
    competitionId: summary.id,
    name: summary.name || wcif.name || summary.id,
    startDate: summary.start_date,
    endDate: summary.end_date,
    continent,
    country,
    countryIso2,
    city,
    venue: venueName,
    url: competitionUrl(summary.id),
    isUpcoming: true,
    eventIds: Object.keys(eventRoundCounts).sort(),
    eventRoundCounts,
    searchableLocation: buildSearchableLocation([
      continent,
      country,
      countryIso2,
      city,
      venueName,
    ]),
    lastSyncedAt: syncedAt,
    updatedAt: syncedAt,
  };
}
