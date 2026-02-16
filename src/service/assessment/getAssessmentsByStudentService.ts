import { prisma } from "@/lib/prisma"

interface GetAssessmentsFilter {
  studentId?: string
  type?: string
}

export async function getAssessmentsByStudentService(filter: GetAssessmentsFilter) {
  const where: Record<string, unknown> = {}
  if (filter.studentId) where.studentId = filter.studentId
  if (filter.type) where.type = filter.type

  return prisma.assessment.findMany({
    where,
    include: {
      passage: { select: { id: true, title: true, language: true, level: true } },
      oralReading: {
        include: {
          miscues: true,
          behaviors: true,
        },
      },
      comprehension: {
        include: {
          quiz: true,
          answers: {
            include: { question: true },
          },
        },
      },
      student: { select: { id: true, name: true } },
    },
    orderBy: { dateTaken: "desc" },
  })
}