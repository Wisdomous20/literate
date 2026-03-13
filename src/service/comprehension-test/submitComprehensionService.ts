import { prisma } from "@/lib/prisma";
import { gradeEssayAnswer } from "./gradeEssayService";
import classifyComprehensionLevel from "./classifyComprehensionLevel";

interface SubmitAnswer {
  questionId: string;
  answer: string;
}

interface SubmitComprehensionInput {
  assessmentId: string;
  answers: SubmitAnswer[];
}

export async function submitComprehensionService(
  input: SubmitComprehensionInput,
) {
  const { assessmentId, answers } = input;

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: {
        id: true,
        passage: {
          select: {
            content: true,
            quiz: {
              select: {
                id: true,
                questions: {
                  select: {
                    id: true,
                    type: true,
                    questionText: true,
                    correctAnswer: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!assessment?.passage?.quiz) {
      return { success: false, error: "Assessment, passage, or quiz not found." };
    }

    const { passage } = assessment;
    const { quiz } = passage;

     if (!passage || !quiz) {
        return { success: false, error: "Assessment, passage, or quiz not found." };
      }
    const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));

    

    // Truncate passage once — reused across all essay grading calls
    const passageExcerpt = passage.content.slice(0, 1000);

    const mcResults: { questionId: string; answer: string; isCorrect: boolean }[] = [];
    const essayPromises: Promise<{ questionId: string; answer: string; isCorrect: boolean }>[] = [];

    for (const a of answers) {
      const question = questionMap.get(a.questionId);
      if (!question) {
        mcResults.push({ ...a, isCorrect: false });
        continue;
      }

      if (question.type === "MULTIPLE_CHOICE") {
        const isCorrect =
          question.correctAnswer?.trim().toLowerCase() ===
          a.answer.trim().toLowerCase();
        mcResults.push({ ...a, isCorrect });
      } else {
        essayPromises.push(
          gradeEssayAnswer({
            questionText: question.questionText,
            correctAnswer: question.correctAnswer,
            passageContent: passageExcerpt, 
            studentAnswer: a.answer,
          }).then((result) => ({
            ...a,
            isCorrect: result.isCorrect,
          }))
        );
      }
    }

    const essayResults = await Promise.all(essayPromises);
    const gradedAnswers = [...mcResults, ...essayResults];

    const totalItems = quiz.questions.length;
    const score = gradedAnswers.filter((a) => a.isCorrect).length;
    const percentage = totalItems > 0 ? (score / totalItems) * 100 : 0;
    const level = classifyComprehensionLevel(percentage);

    const comprehensionTest = await prisma.comprehensionTest.create({
      data: {
        assessmentId,
        quizId: quiz.id,
        score,
        totalItems,
        classificationLevel: level,
        answers: {
          create: gradedAnswers.map((a) => ({
            questionId: a.questionId,
            answer: a.answer,
            isCorrect: a.isCorrect,
          })),
        },
      },
      select: { id: true },
    });

    return {
      success: true,
      assessmentId,
      comprehensionTestId: comprehensionTest.id,
      score,
      totalItems,
      percentage: Math.round(percentage),
      level,
    };
  } catch (error) {
    console.error("Error submitting comprehension test:", error);
    return { success: false, error: "Failed to submit comprehension test." };
  }
}
