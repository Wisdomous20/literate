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

export async function submitComprehensionService(input: SubmitComprehensionInput) {
  const { assessmentId, answers } = input;

  try {
    // Get assessment with passage and its quiz + questions
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        passage: {
          include: {
            quiz: {
              include: {
                questions: true,
              },
            },
          },
        },
      },
    });

    if (!assessment) {
      return { success: false, error: "Assessment not found." };
    }

    const passage = assessment.passage;
    if (!passage) {
      return { success: false, error: "Passage not found." };
    }

    const quiz = passage.quiz;
    if (!quiz) {
      return { success: false, error: "Quiz not found for this passage." };
    }

    const questions = quiz.questions;
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

        // Essay questions — grade with OpenAI
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

    // Create ComprehensionTest + ComprehensionAnswers
    const result = await prisma.$transaction(async (tx) => {
      const comprehensionTest = await tx.comprehensionTest.create({
        data: {
          assessmentId,
          quizId: quiz.id,
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

      return { comprehensionTest };
    });

    return {
      success: true,
      assessmentId,
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