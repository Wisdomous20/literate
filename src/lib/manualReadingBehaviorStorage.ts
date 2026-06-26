import {
  READING_BEHAVIOR_DEFINITIONS,
  type ReadingBehaviorType,
} from "@/lib/readingBehaviors";

const STORAGE_PREFIX = "literate:manual-reading-behaviors";
const allowedBehaviorTypes = new Set(
  READING_BEHAVIOR_DEFINITIONS.map((behavior) => behavior.key),
);

export interface ManualReadingBehaviorState {
  behaviorTypes: ReadingBehaviorType[];
  otherObservations: string;
}

function getStorageKey(sessionId: string) {
  return `${STORAGE_PREFIX}:${sessionId}`;
}

function isReadingBehaviorType(value: unknown): value is ReadingBehaviorType {
  return typeof value === "string" && allowedBehaviorTypes.has(value as ReadingBehaviorType);
}

export function loadManualReadingBehaviorState(
  sessionId: string | null | undefined,
): ManualReadingBehaviorState | null {
  if (!sessionId || typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getStorageKey(sessionId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ManualReadingBehaviorState>;
    return {
      behaviorTypes: Array.isArray(parsed.behaviorTypes)
        ? parsed.behaviorTypes.filter(isReadingBehaviorType)
        : [],
      otherObservations:
        typeof parsed.otherObservations === "string"
          ? parsed.otherObservations
          : "",
    };
  } catch {
    return null;
  }
}

export function saveManualReadingBehaviorState(
  sessionId: string | null | undefined,
  behaviorTypes: ReadingBehaviorType[],
  otherObservations: string,
) {
  if (!sessionId || typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      getStorageKey(sessionId),
      JSON.stringify({
        behaviorTypes: [...new Set(behaviorTypes)],
        otherObservations,
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch {}
}

export function mergeManualReadingBehaviorItems<
  T extends { key?: ReadingBehaviorType; checked?: boolean },
>(items: T[], state: ManualReadingBehaviorState | null): T[] {
  if (!state) return items;

  const selectedTypes = new Set(state.behaviorTypes);
  return items.map((item) =>
    item.key ? { ...item, checked: selectedTypes.has(item.key) } : item,
  );
}
