export function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

export function buildSearchableLocation(parts: Array<string | undefined>): string {
  return parts
    .filter(Boolean)
    .map((part) => normalizeText(part as string))
    .join(" ");
}
