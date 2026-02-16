import { prisma } from "@/lib/prisma"

interface CreateAssessmentInput {
  studentId: string
  type: "ORAL_READING" | "COMPREHENSION" | "READING_FLUENCY"
  passageId: string
  quizId?: string
}


export async function createAssessment(input: CreateAssessmentInput) {
  const { studentId, type, passageId, quizId } = input

  if (!studentId || !type || !passageId) {
    throw new Error("studentId, type, and passageId are required")
  }

  return prisma.assessment.create({
    data: {
      studentId,
      type,
      passageId,
      ...(quizId && { quizId }),
    },
  })
}