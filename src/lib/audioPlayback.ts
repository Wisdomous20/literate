type SeekableAudio = Pick<HTMLAudioElement, "currentTime" | "duration" | "play">;

export function clampAudioTimestamp(timestamp: number, duration?: number) {
  if (!Number.isFinite(timestamp)) return null;

  const nonNegativeTimestamp = Math.max(0, timestamp);
  if (duration !== undefined && Number.isFinite(duration) && duration > 0) {
    return Math.min(nonNegativeTimestamp, duration);
  }

  return nonNegativeTimestamp;
}

export function seekAudioToTimestamp(
  audio: SeekableAudio | null | undefined,
  timestamp: number,
  options: { play?: boolean } = {},
) {
  if (!audio) return false;

  const targetTimestamp = clampAudioTimestamp(timestamp, audio.duration);
  if (targetTimestamp === null) return false;

  try {
    audio.currentTime = targetTimestamp;
    if (options.play !== false) {
      void audio.play().catch(() => {});
    }
    return true;
  } catch {
    return false;
  }
}

export function formatMiscueTimestamp(timestamp: number) {
  if (!Number.isFinite(timestamp)) return "00:00.0";

  const safeTimestamp = Math.max(0, timestamp);
  const minutes = Math.floor(safeTimestamp / 60);
  const seconds = safeTimestamp - minutes * 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds.toFixed(1).padStart(4, "0")}`;
}
