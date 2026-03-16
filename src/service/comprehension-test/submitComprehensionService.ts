import { prisma } from "@/lib/prisma";
import { gradeEssayAnswer } from "./gradeEssayService";
import classifyComprehensionLevel from "./classifyComprehensionLevel";
import { Tags } from "@/generated/prisma/enums";

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
                    tags: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!assessment?.passage) {
      return { success: false, error: "Assessment or passage not found." };
    }

    const { passage } = assessment;
    const quiz = passage.quiz;

    if (!quiz) {
      return { success: false, error: "No quiz found for this passage." };
    }

    const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));
    const passageExcerpt = passage.content.slice(0, 1000);

    const mcResults: {
      questionText: string;
      answer: string;
      isCorrect: boolean;
      tag: Tags;
    }[] = [];

    const essayPromises: Promise<{
      questionText: string;
      answer: string;
      isCorrect: boolean;
      tag: Tags;
    }>[] = [];

    for (const a of answers) {
      const question = questionMap.get(a.questionId);
      if (!question) {
        mcResults.push({
          questionText: a.questionId,
          answer: a.answer,
          isCorrect: false,
          tag: Tags.Literal,
        });
        continue;
      }

      if (question.type === "MULTIPLE_CHOICE") {
        const isCorrect =
          question.correctAnswer?.trim().toLowerCase() ===
          a.answer.trim().toLowerCase();
        mcResults.push({
          questionText: question.questionText,
          answer: a.answer,
          isCorrect,
          tag: question.tags,
        });
      } else {
        essayPromises.push(
          gradeEssayAnswer({
            questionText: question.questionText,
            correctAnswer: question.correctAnswer,
            passageContent: passageExcerpt,
            studentAnswer: a.answer,
          }).then((result) => ({
            questionText: question.questionText,
            answer: a.answer,
            isCorrect: result.isCorrect,
            tag: question.tags,
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
        score,
        totalItems,
        classificationLevel: level,
        answers: {
          create: gradedAnswers.map((a) => ({
            question: a.questionText,  // stored as plain string per schema
            tag: a.tag,
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
  answers: quiz.questions.map((q) => {
    const graded = gradedAnswers.find((a) => a.questionText === q.questionText);
    return {
      tag: q.tags,
      isCorrect: graded?.isCorrect ?? false,
    };
  }),
};
  } catch (error) {
    console.error("Error submitting comprehension test:", error);
    return { success: false, error: "Failed to submit comprehension test." };
  }
}