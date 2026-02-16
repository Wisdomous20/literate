import { prisma } from "@/lib/prisma"

interface CreateAssessmentInput {
  studentId: string
  type: "ORAL_READING" | "COMPREHENSION" | "READING_FLUENCY"
  passageId: string
}

interface CreateAssessmentResult {
  success: boolean
  assessment?: {
    id: string
    studentId: string
    type: string
    passageId: string
    dateTaken: Date
  }
  error?: string
  code?: "VALIDATION_ERROR" | "INTERNAL_ERROR"
}

export async function createAssessmentService(
  input: CreateAssessmentInput
): Promise<CreateAssessmentResult> {
  const { studentId, type, passageId } = input

  if (!studentId || !type || !passageId) {
    return {
      success: false,
      error: "studentId, type, and passageId are required.",
      code: "VALIDATION_ERROR",
    }
  }

  try {
    const assessment = await prisma.assessment.create({
      data: {
        studentId,
        type,
        passageId,
      },
    })

    return {
      success: true,
      assessment: {
        id: assessment.id,
        studentId: assessment.studentId,
        type: assessment.type,
        passageId: assessment.passageId,
        dateTaken: assessment.dateTaken,
      },
    }
  } catch (error) {
    console.error("Error creating assessment:", error)
    return {
      success: false,
      error: "An internal error occurred while creating the assessment.",
      code: "INTERNAL_ERROR",
    }
  }
}