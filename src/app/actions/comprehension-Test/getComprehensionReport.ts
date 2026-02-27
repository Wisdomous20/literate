"use server";

import { prisma } from "@/lib/prisma";

export async function getComprehensionReportAction(assessmentId: string) {
  if (!assessmentId) {
    return { success: false, error: "Assessment ID is required" };
  }

  try {
    const comprehensionTest = await prisma.comprehensionTest.findUnique({
      where: { assessmentId },
      include: {
        answers: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                tags: true,
                type: true,
                options: true,
                correctAnswer: true,
              },
            },
          },
        },
        assessment: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                level: true,
                class: { select: { name: true } },
              },
            },
            passage: {
              select: {
                id: true,
                title: true,
                content: true,
                language: true,
                level: true,
                testType: true,
              },
            },
          },
        },
      },
    });

    if (!comprehensionTest) {
      return { success: false, error: "Comprehension test not found for this assessment." };
    }

    return { success: true, comprehensionTest };
  } catch (error) {
    console.error("Error fetching comprehension report:", error);
    return { success: false, error: "Failed to fetch comprehension report." };
  }
}
