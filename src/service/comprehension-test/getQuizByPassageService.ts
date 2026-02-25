import { prisma } from "@/lib/prisma";

export async function getQuizByPassageService(passageId: string) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { passageId },
      include: {
        passage: {
          select: { id: true, title: true, content: true, language: true, level: true },
        },
        questions: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            questionText: true,
            tags: true,
            type: true,
            options: true,
            // NOTE: Do NOT select correctAnswer here — it's sent to the client
          },
        },
      },
    });

    if (!quiz) {
      return { success: false, error: "No quiz found for this passage." };
    }

    return { success: true, quiz };
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return { success: false, error: "Failed to fetch quiz." };
  }
}