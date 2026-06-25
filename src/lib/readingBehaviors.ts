export type ReadingBehaviorType =
  | "WORD_BY_WORD_READING"
  | "MONOTONOUS_READING"
  | "DISMISSAL_OF_PUNCTUATION"
  | "VOICE_HARDLY_AUDIBLE"
  | "FINGER_POINTING"
  | "LITTLE_OR_NO_ANALYSIS";

export type ReadingBehaviorSource = "automated" | "teacher";

export interface ReadingBehaviorDefinition {
  key: ReadingBehaviorType;
  label: string;
  description: string;
  source: ReadingBehaviorSource;
}

export const READING_BEHAVIOR_DEFINITIONS: ReadingBehaviorDefinition[] = [
  {
    key: "WORD_BY_WORD_READING",
    label: "Does word-by-word reading",
    description: "(Nagbabasa nang pa-isa isang salita)",
    source: "automated",
  },
  {
    key: "MONOTONOUS_READING",
    label: "Lacks expression; reads in a monotonous tone",
    description: "(Walang damdamin; walang pagbabago ang tono)",
    source: "automated",
  },
  {
    key: "DISMISSAL_OF_PUNCTUATION",
    label: "Disregards punctuation",
    description: "(Hindi pinapansin ang mga bantas)",
    source: "automated",
  },
  {
    key: "VOICE_HARDLY_AUDIBLE",
    label: "Voice is hardly audible",
    description: "(Hindi madaling marinig ang boses)",
    source: "teacher",
  },
  {
    key: "FINGER_POINTING",
    label: "Points to each word with his/her finger",
    description: "(Itinuturo ang bawat salita)",
    source: "teacher",
  },
  {
    key: "LITTLE_OR_NO_ANALYSIS",
    label: "Employs little or no method of analysis",
    description: "(Bahagya o walang paraan ng pagsusuri)",
    source: "teacher",
  },
];

export function buildReadingBehaviorItems(
  behaviors: Array<{ behaviorType: string }> | undefined,
) {
  const detectedTypes = new Set(
    (behaviors ?? []).map((behavior) => behavior.behaviorType),
  );

  return READING_BEHAVIOR_DEFINITIONS.map((behavior) => ({
    ...behavior,
    checked: detectedTypes.has(behavior.key),
  }));
}
