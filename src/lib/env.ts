const getEnv = (name: string) => process.env[name]?.trim();

export const env = {
  appName: getEnv("NEXT_PUBLIC_APP_NAME") || "WCA Upcoming Competition Search",
  syncSecret: getEnv("SYNC_API_SECRET") || "",
  wcaBaseUrl: getEnv("WCA_BASE_URL") || "https://www.worldcubeassociation.org",
  syncConcurrency: Number(getEnv("SYNC_CONCURRENCY") || "2"),
  syncBatchDelayMs: Number(getEnv("SYNC_BATCH_DELAY_MS") || "750"),
  syncCompetitionRetryCount: Number(getEnv("SYNC_COMPETITION_RETRY_COUNT") || "2"),
};

export function getRequiredEnv(name: string): string {
  const value = getEnv(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
