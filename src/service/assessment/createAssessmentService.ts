import { prisma } from "@/lib/prisma";
import { checkDailyLimit } from "@/service/assessment/checkDailyLimitService";

interface CreateAssessmentInput {
  userId?: string;
  studentId: string;
  type: "ORAL_READING" | "COMPREHENSION" | "READING_FLUENCY";
  passageId: string;
}

interface CreateAssessmentResult {
  success: boolean;
  assessment?: {
    id: string;
    studentId: string;
    type: string;
    passageId: string;
    dateTaken: Date;
  };
  error?: string;
  code?:
    | "VALIDATION_ERROR"
    | "FORBIDDEN"
    | "DAILY_LIMIT_REACHED"
    | "INTERNAL_ERROR";
}

export async function createAssessmentService(
  input: CreateAssessmentInput
): Promise<CreateAssessmentResult> {
  const { userId, studentId, type, passageId } = input;

  if (!studentId || !type || !passageId) {
    return {
      success: false,
      error: "studentId, type, and passageId are required.",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    // Look up the student's class to find the owning user
    const student = userId
      ? await prisma.student.findFirst({
          where: {
            id: studentId,
            archived: false,
            class: { userId, archived: false },
          },
          include: {
            class: {
              select: { userId: true },
            },
          },
        })
      : await prisma.student.findUnique({
          where: { id: studentId },
          include: {
            class: {
              select: { userId: true },
            },
          },
        });

    if (!student) {
      return {
        success: false,
        error: "Student not found or access denied.",
        code: userId ? "FORBIDDEN" : "VALIDATION_ERROR",
      };
    }

    const owningUserId = student.class.userId;

    // Check daily limit for free-tier users
    const limitCheck = await checkDailyLimit(owningUserId, type);

    if (!limitCheck.allowed) {
      return {
        success: false,
        error: limitCheck.reason || "Daily assessment limit reached.",
        code: "DAILY_LIMIT_REACHED",
      };
    }

    const assessment = await prisma.assessment.create({
      data: {
        studentId,
        type,
        passageId,
      },
    });

    return {
      success: true,
      assessment: {
        id: assessment.id,
        studentId: assessment.studentId,
        type: assessment.type,
        passageId: assessment.passageId,
        dateTaken: assessment.dateTaken,
      },
    };
  } catch (error) {
    console.error("Error creating assessment:", error);
    return {
      success: false,
      error: "An internal error occurred while creating the assessment.",
      code: "INTERNAL_ERROR",
    };
  }
}
