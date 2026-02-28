import { LevelClassification } from "@/generated/prisma/enums";

/**
 *
 *   INDEPENDENT + INDEPENDENT     = INDEPENDENT
 *   INDEPENDENT + INSTRUCTIONAL   = INSTRUCTIONAL
 *   INSTRUCTIONAL + INSTRUCTIONAL = INSTRUCTIONAL
 *   INSTRUCTIONAL + FRUSTRATION   = FRUSTRATION
 *   FRUSTRATION + FRUSTRATION     = FRUSTRATION
 *   FRUSTRATION + INDEPENDENT     = FRUSTRATION
 *
 */

const LEVEL_RANK: Record<LevelClassification, number> = {
  [LevelClassification.INDEPENDENT]: 0,
  [LevelClassification.INSTRUCTIONAL]: 1,
  [LevelClassification.FRUSTRATION]: 2,
};

export function classifyOralReadingLevel(
  fluencyLevel: LevelClassification,
  comprehensionLevel: LevelClassification
): LevelClassification {
  const fluencyRank = LEVEL_RANK[fluencyLevel];
  const comprehensionRank = LEVEL_RANK[comprehensionLevel];

  const worstRank = Math.max(fluencyRank, comprehensionRank);

  const entry = Object.entries(LEVEL_RANK).find(([, rank]) => rank === worstRank);
  return entry![0] as LevelClassification;
}