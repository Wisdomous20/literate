import { prisma } from "@/lib/prisma";

export interface RecentAssessmentItem {
  id: string;
  studentName: string;
  assessmentType: string;
  dateTaken: Date;
  classificationLevel: string;
}

interface GetRecentAssessmentsResult {
  success: boolean;
  assessments?: RecentAssessmentItem[];
  error?: string;
}

export async function getRecentAssessmentsService(
  userId: string,
  schoolYear: string,
): Promise<GetRecentAssessmentsResult> {
  try {
    const recentAssessments = await prisma.assessment.findMany({
      where: {
        student: {
          archived: false,
          classRoom: {
            userId,
            schoolYear,
            archived: false,
          },
        },
      },
      include: {
        student: { select: { id: true, name: true, level: true } },
        oralFluency: { select: { classificationLevel: true } },
        comprehension: { select: { classificationLevel: true } },
        oralReadingResult: { select: { classificationLevel: true } },
      },
      orderBy: { dateTaken: "desc" },
      take: 30,
    });

    const belowGradeLevel: RecentAssessmentItem[] = [];

    for (const a of recentAssessments) {
      let classification: string | null = null;

      if (a.type === "ORAL_READING" && a.oralReadingResult) {
        classification = a.oralReadingResult.classificationLevel;
      } else if (a.type === "READING_FLUENCY" && a.oralFluency) {
        classification = a.oralFluency.classificationLevel ?? null;
      } else if (a.type === "COMPREHENSION" && a.comprehension) {
        classification = a.comprehension.classificationLevel;
      }

      if (
        classification === "FRUSTRATION" ||
        classification === "INSTRUCTIONAL"
      ) {
        belowGradeLevel.push({
          id: a.id,
          studentName: a.student.name,
          assessmentType: a.type,
          dateTaken: a.dateTaken,
          classificationLevel: classification,
        });
      }
    }

    return { success: true, assessments: belowGradeLevel.slice(0, 4) };
  } catch (error) {
    console.error("Failed to fetch recent assessments:", error);
    return {
      success: false,
      error: "Failed to fetch recent assessments",
    };
  }
}