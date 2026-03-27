import { describe, expect, it } from "vitest";

import { matchesCompetitionFilters } from "../lib/search";
import { extractEventRoundCounts } from "../lib/wca";
import type { CompetitionDocument } from "../types/competition";

describe("extractEventRoundCounts", () => {
  it("counts rounds from WCIF events", () => {
    const result = extractEventRoundCounts({
      events: [
        { id: "333", rounds: [{}, {}, {}] },
        { id: "333oh", rounds: [{}, {}] },
      ],
    });

    expect(result).toEqual({
      "333": 3,
      "333oh": 2,
    });
  });
});

describe("matchesCompetitionFilters", () => {
  const competition: CompetitionDocument = {
    competitionId: "TestOpen2026",
    name: "Test Open 2026",
    startDate: "2026-06-10",
    endDate: "2026-06-11",
    country: "Japan",
    countryIso2: "JP",
    city: "Tokyo",
    venue: "Community Hall",
    url: "https://example.com",
    isUpcoming: true,
    eventIds: ["333", "333oh"],
    eventRoundCounts: {
      "333": 3,
      "333oh": 2,
    },
    searchableLocation: "japan jp tokyo community hall",
    lastSyncedAt: "2026-03-28T00:00:00.000Z",
    updatedAt: "2026-03-28T00:00:00.000Z",
  };

  it("matches location and minimum rounds", () => {
    expect(
      matchesCompetitionFilters(competition, {
        location: "Japan",
        eventId: "333",
        roundsGte: 3,
      }),
    ).toBe(true);
  });

  it("rejects when round count is too low", () => {
    expect(
      matchesCompetitionFilters(competition, {
        eventId: "333oh",
        roundsGte: 3,
      }),
    ).toBe(false);
  });
});
