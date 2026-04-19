import { prisma } from "@/lib/prisma";

export type AssessmentTypeFilter =
  | "ALL"
  | "ORAL_READING"
  | "READING_FLUENCY"
  | "COMPREHENSION";

export type TestTypeFilter = "PRE" | "POST";

export interface ClassificationDistribution {
  independent: number;
  instructional: number;
  frustration: number;
}

const TEST_TYPE_MAP = {
  PRE: "PRE_TEST",
  POST: "POST_TEST",
} as const;

function emptyDistribution(): ClassificationDistribution {
  return { independent: 0, instructional: 0, frustration: 0 };
}

function addLevel(
  dist: ClassificationDistribution,
  level: "INDEPENDENT" | "INSTRUCTIONAL" | "FRUSTRATION" | null | undefined
): void {
  if (level === "INDEPENDENT") dist.independent += 1;
  else if (level === "INSTRUCTIONAL") dist.instructional += 1;
  else if (level === "FRUSTRATION") dist.frustration += 1;
}

export async function getClassificationDistribution(
  userId: string,
  schoolYear: string,
  assessmentType: AssessmentTypeFilter,
  testType: TestTypeFilter
): Promise<ClassificationDistribution> {
  const passageTestType = TEST_TYPE_MAP[testType];

  const classroomScope = {
    student: {
      classRoom: {
        userId,
        schoolYear,
        archived: false,
      },
      archived: false,
    },
    passage: { testType: passageTestType },
  } as const;

  const dist = emptyDistribution();
  const includeOralReading =
    assessmentType === "ALL" || assessmentType === "ORAL_READING";
  const includeFluency =
    assessmentType === "ALL" || assessmentType === "READING_FLUENCY";
  const includeComprehension =
    assessmentType === "ALL" || assessmentType === "COMPREHENSION";

  const tasks: Promise<unknown>[] = [];

  if (includeOralReading) {
    tasks.push(
      prisma.oralReadingResult
        .findMany({
          where: { assessment: classroomScope },
          select: { classificationLevel: true },
        })
        .then((rows) => rows.forEach((r) => addLevel(dist, r.classificationLevel)))
    );
  }

  if (includeFluency) {
    tasks.push(
      prisma.oralFluencySession
        .findMany({
          where: {
            deletedAt: null,
            classificationLevel: { not: null },
            assessment: classroomScope,
          },
          select: { classificationLevel: true },
        })
        .then((rows) => rows.forEach((r) => addLevel(dist, r.classificationLevel)))
    );
  }

  if (includeComprehension) {
    tasks.push(
      prisma.comprehensionTest
        .findMany({
          where: { assessment: classroomScope },
          select: { classificationLevel: true },
        })
        .then((rows) => rows.forEach((r) => addLevel(dist, r.classificationLevel)))
    );
  }

  await Promise.all(tasks);

  return dist;
}
