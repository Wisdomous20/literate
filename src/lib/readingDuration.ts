export function sanitizeDurationSeconds(value?: number | null): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

export function resolveReadingDurationSeconds(
  duration?: number | null,
  fallbackSeconds?: number | null,
): number {
  const resolvedDuration = sanitizeDurationSeconds(duration);
  if (resolvedDuration > 0) {
    return resolvedDuration;
  }

  return sanitizeDurationSeconds(fallbackSeconds);
}

export function getDisplayReadingTimeSeconds(
  duration?: number | null,
  fallbackSeconds?: number | null,
): number {
  return Math.round(resolveReadingDurationSeconds(duration, fallbackSeconds));
}

export function calculateWordsCorrectPerMinute(
  wordsCorrect: number,
  durationSeconds?: number | null,
): number {
  const safeWordsCorrect =
    typeof wordsCorrect === "number" && Number.isFinite(wordsCorrect)
      ? Math.max(0, wordsCorrect)
      : 0;
  const safeDuration = sanitizeDurationSeconds(durationSeconds);

  return safeDuration > 0
    ? Math.round((safeWordsCorrect / safeDuration) * 60)
    : 0;
}

export function formatAudioClock(
  seconds: number,
  rounding: "floor" | "nearest" = "floor",
  padMinutes = false,
): string {
  const safeSeconds =
    typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0
      ? seconds
      : 0;
  const wholeSeconds =
    rounding === "nearest" ? Math.round(safeSeconds) : Math.floor(safeSeconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainingSeconds = wholeSeconds % 60;

  return `${padMinutes ? String(minutes).padStart(2, "0") : String(minutes)}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}
