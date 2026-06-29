import { prisma } from "@/lib/prisma";

export async function getQuizByPassageService(passageId: string) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { passageId },
      select:{
        id:true,
        questions: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            questionText: true,
            tags: true,
            type: true,
            options: true,
          },
        },
      },
    });

    if (!quiz) {
      return { success: false, error: "No quiz found for this passage." };
    }

    if (quiz.questions.length === 0) {
      return {
        success: false,
        error: "This passage has no quiz questions. Please add questions first.",
      };
    }

    return { success: true, quiz };
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return { success: false, error: "Failed to fetch quiz." };
  }
}
