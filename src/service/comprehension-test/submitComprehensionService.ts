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
                    tags: true, // needed to denormalize onto the answer
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


      if (!quiz) {
        return { success: false, error: "No quiz found for this passage." };
      }

    const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));

    const passageExcerpt = passage.content.slice(0, 1000);

    const mcResults: { questionId: string; answer: string; isCorrect: boolean; tag: string }[] = [];
    const essayPromises: Promise<{ questionId: string; answer: string; isCorrect: boolean; tag: string }>[] = [];

    for (const a of answers) {
      const question = questionMap.get(a.questionId);
      if (!question) {
        mcResults.push({ ...a, isCorrect: false, tag: "Literal" });
        continue;
      }

      if (question.type === "MULTIPLE_CHOICE") {
        const isCorrect =
          question.correctAnswer?.trim().toLowerCase() ===
          a.answer.trim().toLowerCase();
        mcResults.push({ ...a, isCorrect, tag: question.tags });
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
            tag: question.tags, // copy tag at write time
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
            question: a.questionId, 
            tag: a.tag as Tags,           
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
      answers: gradedAnswers.map((a) => ({
        tag: a.tag,      
        isCorrect: a.isCorrect,
      })),
    };
  } catch (error) {
    console.error("Error submitting comprehension test:", error);
    return { success: false, error: "Failed to submit comprehension test." };
  }
}