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
    // Only fetch what we need — use select to reduce data transfer
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

    // Separate MC and essay answers — grade MC synchronously, essay in parallel
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
        // Fire off all essay grading calls concurrently
        essayPromises.push(
          gradeEssayAnswer({
            questionText: question.questionText,
            correctAnswer: question.correctAnswer,
            passageContent: passage.content,
            studentAnswer: a.answer,
          }).then((essayResult) => ({
            ...a,
            isCorrect: essayResult.isCorrect,
          }))
        );
      }
    }

    // All essay grades run in TRUE parallel (not sequential)
    const essayResults = await Promise.all(essayPromises);
    const gradedAnswers = [...mcResults, ...essayResults];

    const totalItems = questions.length;
    const score = gradedAnswers.filter((a) => a.isCorrect === true).length;
    const percentage = totalItems > 0 ? (score / totalItems) * 100 : 0;
    const level = classifyComprehensionLevel(percentage);

    // Create ComprehensionTest + ComprehensionAnswers
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
      include: {
        answers: { include: { question: true } },
      },
    });

    return {
      success: true,
      assessmentId,
      comprehensionTestId: comprehensionTest.id,
      score,
      totalItems,
      percentage: Math.round(percentage),
      level,
      answers: comprehensionTest.answers,
    };
  } catch (error) {
    console.error("Error submitting comprehension test:", error);
    return { success: false, error: "Failed to submit comprehension test." };
  }
}