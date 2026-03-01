import { LevelClassification } from "@/generated/prisma/enums";
export default function classifyComprehensionLevel(percentage: number): LevelClassification {
  if (percentage >= 80) return LevelClassification.INDEPENDENT;
  if (percentage >= 59) return LevelClassification.INSTRUCTIONAL;
  return LevelClassification.FRUSTRATION;
}