import { prisma } from "@/lib/prisma";

interface CreateAssessmentInput {
  studentId: string
  type: "ORAL_READING" | "COMPREHENSION" | "ORAL_READING_TEST"
}

export default async function createAssessment(input: CreateAssessmentInput) {
  const { studentId, type } = input

  const student = await prisma.student.findUnique({
    where: { id: studentId },
  })

  if (!student) {
    throw new Error("Student not found")
  }

  return  await prisma.assessment.create({
    data: {
      studentId,
      type,
    },
  });

}