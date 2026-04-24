import { prisma } from "@/lib/prisma";
import { checkDailyLimit } from "@/service/assessment/checkDailyLimitService";
import { createAssessmentSchema } from "@/lib/validation/assessment";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

interface CreateAssessmentInput {
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
  code?: "VALIDATION_ERROR" | "DAILY_LIMIT_REACHED" | "INTERNAL_ERROR";
}

export async function createAssessmentService(
  input: CreateAssessmentInput
): Promise<CreateAssessmentResult> {
  const validationResult = createAssessmentSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
      code: "VALIDATION_ERROR",
    };
  }
  const { studentId, type, passageId } = validationResult.data;

  try {
    // Look up the student's classroom to find the owning user
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        classRoom: {
          select: { userId: true },
        },
      },
    });

    if (!student) {
      return {
        success: false,
        error: "Student not found.",
        code: "VALIDATION_ERROR",
      };
    }

    const userId = student.classRoom.userId;

    // Check daily limit for free-tier users
    const limitCheck = await checkDailyLimit(userId, type);

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
