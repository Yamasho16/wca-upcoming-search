import { getDb } from "@/lib/firebase-admin";
import type {
  CompetitionDocument,
  CompetitionEventDocument,
} from "@/types/competition";

export async function upsertCompetition(competition: CompetitionDocument): Promise<void> {
  const db = getDb();
  const competitionsCollection = db.collection("competitions");
  const batch = db.batch();
  const competitionRef = competitionsCollection.doc(competition.competitionId);

  batch.set(competitionRef, competition, { merge: true });

  for (const [eventId, roundCount] of Object.entries(competition.eventRoundCounts)) {
    const eventDoc: CompetitionEventDocument = {
      eventId,
      roundCount,
      updatedAt: competition.updatedAt,
    };

    batch.set(competitionRef.collection("events").doc(eventId), eventDoc, { merge: true });
  }

  await batch.commit();
}

export async function markMissingCompetitionsAsNotUpcoming(
  activeCompetitionIds: Set<string>,
  updatedAt: string,
): Promise<number> {
  const db = getDb();
  const competitionsCollection = db.collection("competitions");
  const snapshot = await competitionsCollection.where("isUpcoming", "==", true).get();

  const batch = db.batch();
  let count = 0;

  snapshot.docs.forEach((document) => {
    if (activeCompetitionIds.has(document.id)) {
      return;
    }

    batch.set(
      document.ref,
      {
        isUpcoming: false,
        updatedAt,
      },
      { merge: true },
    );
    count += 1;
  });

  if (count > 0) {
    await batch.commit();
  }

  return count;
}

export async function listUpcomingCompetitions(): Promise<CompetitionDocument[]> {
  const db = getDb();
  const competitionsCollection = db.collection("competitions");
  const snapshot = await competitionsCollection.where("isUpcoming", "==", true).get();

  return snapshot.docs
    .map((document) => document.data() as CompetitionDocument)
    .sort((left, right) => left.startDate.localeCompare(right.startDate));
}
