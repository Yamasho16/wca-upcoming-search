export type EventRoundCounts = Record<string, number>;

export type CompetitionDocument = {
  competitionId: string;
  name: string;
  startDate: string;
  endDate: string;
  continent: string;
  country: string;
  countryIso2: string;
  city: string;
  venue: string;
  url: string;
  isUpcoming: boolean;
  eventIds: string[];
  eventRoundCounts: EventRoundCounts;
  searchableLocation: string;
  lastSyncedAt: string;
  updatedAt: string;
};

export type CompetitionEventDocument = {
  eventId: string;
  roundCount: number;
  updatedAt: string;
};

export type CompetitionSearchParams = {
  location?: string;
  country?: string;
  region?: string;
  eventId?: string;
  roundsGte?: number;
  startFrom?: string;
  startTo?: string;
};

export type CompetitionSearchResult = Pick<
  CompetitionDocument,
  | "competitionId"
  | "name"
  | "startDate"
  | "endDate"
  | "continent"
  | "country"
  | "city"
  | "venue"
  | "url"
  | "eventRoundCounts"
>;

export type CompetitionsApiResponse = {
  items: CompetitionSearchResult[];
  total: number;
  filters: CompetitionSearchParams;
};

export type SyncCompetitionResult = {
  competitionId: string;
  status: "synced" | "failed";
  message?: string;
};

export type SyncSummary = {
  startedAt: string;
  finishedAt: string;
  page: number;
  offset: number;
  chunkSize: number;
  fetchedCompetitionCount: number;
  syncedCompetitionCount: number;
  failedCompetitionCount: number;
  deactivatedCompetitionCount: number;
  hasNextChunk: boolean;
  nextOffset: number | null;
  hasNextPage: boolean;
  nextPage: number | null;
  finalized: boolean;
  results: SyncCompetitionResult[];
};
