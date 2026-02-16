import { prisma } from "@/lib/prisma"


export async function getAssessmentById(id: string) {
  return prisma.assessment.findUnique({
    where: { id },
    include: {
      passage: true,
      oralReading: {
        include: {
          miscues: { orderBy: { wordIndex: "asc" } },
          behaviors: true,
          wordTimestamps: { orderBy: { index: "asc" } },
        },
      },
      comprehension: {
        include: {
          quiz: true,
          answers: { include: { question: true } },
        },
      },
      student: { select: { id: true, name: true } },
    },
  })
}