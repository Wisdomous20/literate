import { DAILY_WORDS } from "./words";

function dayOfYearUTC(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const now = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((now - start) / 86_400_000);
}

export function getDailyWord(date: Date = new Date()): string {
  const index = dayOfYearUTC(date) % DAILY_WORDS.length;
  return DAILY_WORDS[index];
}
