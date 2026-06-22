import { prisma } from "@/lib/prisma";

export type AssessmentTypeFilter =
  | "ALL"
  | "ORAL_READING"
  | "READING_FLUENCY"
  | "COMPREHENSION";

export type TestTypeFilter = "PRE" | "POST";
export type GradeFilter = "ALL" | number;

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
  testType: TestTypeFilter,
  grade: GradeFilter = "ALL"
): Promise<ClassificationDistribution> {
  const passageTestType = TEST_TYPE_MAP[testType];

  const assessmentScope = {
    student: {
      classRoom: {
        userId,
        schoolYear,
        archived: false,
      },
      archived: false,
      ...(grade === "ALL" ? {} : { level: grade }),
    },
    passage: { testType: passageTestType },
    ...(assessmentType === "ALL" ? {} : { type: assessmentType }),
  };

  const assessments = await prisma.assessment.findMany({
    where: assessmentScope,
    orderBy: [{ dateTaken: "desc" }, { id: "desc" }],
    select: {
      id: true,
      studentId: true,
      type: true,
      oralReadingResult: { select: { classificationLevel: true } },
      oralFluency: { select: { classificationLevel: true, deletedAt: true } },
      comprehension: { select: { classificationLevel: true } },
    },
  });

  const latestAssessmentByStudent = new Map<string, (typeof assessments)[number]>();
  for (const assessment of assessments) {
    if (!latestAssessmentByStudent.has(assessment.studentId)) {
      latestAssessmentByStudent.set(assessment.studentId, assessment);
    }
  }

  const dist = emptyDistribution();
  for (const assessment of latestAssessmentByStudent.values()) {
    switch (assessment.type) {
      case "ORAL_READING":
        addLevel(dist, assessment.oralReadingResult?.classificationLevel);
        break;
      case "READING_FLUENCY":
        if (assessment.oralFluency?.deletedAt === null) {
          addLevel(dist, assessment.oralFluency.classificationLevel);
        }
        break;
      case "COMPREHENSION":
        addLevel(dist, assessment.comprehension?.classificationLevel);
        break;
    }
  }

  return dist;
}
