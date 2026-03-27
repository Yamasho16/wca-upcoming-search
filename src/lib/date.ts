export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function formatDateRange(startDate: string, endDate: string): string {
  if (startDate === endDate) {
    return startDate;
  }

  return `${startDate} - ${endDate}`;
}
