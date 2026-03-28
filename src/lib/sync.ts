import { markMissingCompetitionsAsNotUpcoming, upsertCompetition } from "@/lib/firestore/competitions";
import { todayIsoDate } from "@/lib/date";
import { env } from "@/lib/env";
import {
  buildCompetitionDocumentFromWca,
  fetchCompetitionPublicWcif,
  fetchUpcomingCompetitionSummariesPage,
  fetchUpcomingCompetitionSummaries,
} from "@/lib/wca";
import type { SyncCompetitionResult, SyncSummary } from "@/types/competition";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runInBatches<T>(
  items: T[],
  batchSize: number,
  handler: (item: T) => Promise<void>,
): Promise<void> {
  for (let index = 0; index < items.length; index += batchSize) {
    const chunk = items.slice(index, index + batchSize);
    await Promise.allSettled(chunk.map((item) => handler(item)));

    if (index + batchSize < items.length && env.syncBatchDelayMs > 0) {
      await sleep(env.syncBatchDelayMs);
    }
  }
}

async function syncSingleCompetitionWithRetry(
  competitionId: string,
  handler: () => Promise<void>,
): Promise<SyncCompetitionResult> {
  const attempts = Math.max(1, env.syncCompetitionRetryCount + 1);
  let lastMessage = "Unknown sync error";

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await handler();

      return {
        competitionId,
        status: "synced",
      };
    } catch (error) {
      lastMessage = error instanceof Error ? error.message : "Unknown sync error";

      if (attempt < attempts) {
        await sleep(attempt * 1500);
      }
    }
  }

  return {
    competitionId,
    status: "failed",
    message: lastMessage,
  };
}

type SyncOptions = {
  page?: number;
  offset?: number;
  chunkSize?: number;
  finalize?: boolean;
  finalizeOnly?: boolean;
};

export async function syncUpcomingCompetitions(
  options: SyncOptions = {},
): Promise<SyncSummary> {
  const page = Math.max(1, options.page || 1);
  const offset = Math.max(0, options.offset || 0);
  const chunkSize = Math.max(1, options.chunkSize || env.syncChunkSize);
  const finalize = options.finalize ?? false;
  const finalizeOnly = options.finalizeOnly ?? false;
  const startDate = todayIsoDate();
  const startedAt = new Date().toISOString();
  const pageSummaries = await fetchUpcomingCompetitionSummariesPage(startDate, page);
  const summaries = finalizeOnly ? [] : pageSummaries.slice(offset, offset + chunkSize);
  const results: SyncCompetitionResult[] = [];

  await runInBatches(summaries, Math.max(1, env.syncConcurrency), async (summary) => {
    const result = await syncSingleCompetitionWithRetry(summary.id, async () => {
      const wcif = await fetchCompetitionPublicWcif(summary.id);
      const document = buildCompetitionDocumentFromWca(summary, wcif, new Date().toISOString());
      await upsertCompetition(document);
    });

    results.push(result);
  });

  const hasNextChunk = !finalizeOnly && offset + chunkSize < pageSummaries.length;
  const nextOffset = hasNextChunk ? offset + chunkSize : null;
  const hasNextPage = !hasNextChunk && pageSummaries.length === 25;
  const nextPage = hasNextPage ? page + 1 : null;
  let deactivatedCompetitionCount = 0;

  if (finalize) {
    const allSummaries = await fetchUpcomingCompetitionSummaries(startDate);
    const activeCompetitionIds = new Set(allSummaries.map((summary) => summary.id));

    deactivatedCompetitionCount = await markMissingCompetitionsAsNotUpcoming(
      activeCompetitionIds,
      new Date().toISOString(),
    );
  }

  const syncedCompetitionCount = results.filter((result) => result.status === "synced").length;
  const failedCompetitionCount = results.length - syncedCompetitionCount;

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    page,
    offset,
    chunkSize,
    fetchedCompetitionCount: summaries.length,
    syncedCompetitionCount,
    failedCompetitionCount,
    deactivatedCompetitionCount,
    hasNextChunk,
    nextOffset,
    hasNextPage,
    nextPage,
    finalized: finalize,
    results: results.sort((left, right) => left.competitionId.localeCompare(right.competitionId)),
  };
}
