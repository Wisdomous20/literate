import { prisma } from "@/lib/prisma";
import { gradeEssayAnswer } from "./gradeEssayService";

interface SubmitAnswer {
  questionId: string;
  answer: string;
}

interface SubmitComprehensionInput {
  studentId: string;
  passageId: string;
  quizId: string;
  answers: SubmitAnswer[];
}

function classifyComprehensionLevel(percentage: number): string {
  if (percentage >= 80) return "INDEPENDENT";
  if (percentage >= 59) return "INSTRUCTIONAL";
  return "FRUSTRATION";
}

export async function submitComprehensionService(input: SubmitComprehensionInput) {
  const { studentId, passageId, quizId, answers } = input;

  try {
    // Fetch all questions with correct answers for grading
    const questions = await prisma.question.findMany({
      where: { quizId },
      select: { id: true, type: true, correctAnswer: true },
    });

   const passage = await prisma.passage.findUnique({
      where: { id: passageId },
      select: { content: true },
    });

    if (!passage) {
      return { success: false, error: "Passage not found." };
    }

  
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Grade each answer
    const gradedAnswers = await Promise.all(
      answers.map(async (a) => {
        const question = questionMap.get(a.questionId);
        if (!question) {
          return { ...a, isCorrect: false };
        }

        if (question.type === "MULTIPLE_CHOICE") {
          const isCorrect =
            question.correctAnswer?.trim().toLowerCase() ===
            a.answer.trim().toLowerCase();
          return { ...a, isCorrect };
        }

        // Essay questions — grade with OpenAI (1 or 0)
        const essayResult = await gradeEssayAnswer({
          questionText: question.questionText,
          correctAnswer: question.correctAnswer,
          studentAnswer: a.answer,
          passageContent: passage.content,
        });

        return { ...a, isCorrect: essayResult.isCorrect };
      })
    );

    const totalItems = questions.length;
    const score = gradedAnswers.filter((a) => a.isCorrect === true).length;
    const percentage = totalItems > 0 ? (score / totalItems) * 100 : 0;
    const level = classifyComprehensionLevel(percentage);

    // Create assessment + comprehension test + answers in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const assessment = await tx.assessment.create({
        data: {
          studentId,
          passageId,
          type: "COMPREHENSION",
        },
      });

      const comprehensionTest = await tx.comprehensionTest.create({
        data: {
          assessmentId: assessment.id,
          quizId,
          score,
          totalItems,
          level,
          answers: {
            create: gradedAnswers.map((a) => ({
              questionId: a.questionId,
              answer: a.answer,
              isCorrect: a.isCorrect,
            })),
          },
        },
        include: {
          answers: { include: { question: true } },
        },
      });

      return { assessment, comprehensionTest };
    });

    return {
      success: true,
      assessmentId: result.assessment.id,
      comprehensionTestId: result.comprehensionTest.id,
      score,
      totalItems,
      percentage: Math.round(percentage),
      level,
      answers: result.comprehensionTest.answers,
    };
  } catch (error) {
    console.error("Error submitting comprehension test:", error);
    return { success: false, error: "Failed to submit comprehension test." };
  }
}