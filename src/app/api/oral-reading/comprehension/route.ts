import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import classifyComprehensionLevel from "@/service/comprehension-test/classifyComprehensionLevel";
import { createOralReadingService } from "@/service/oral-reading/createOralReadingService";
import { Tags } from "@/generated/prisma/enums";
import { oralReadingComprehensionSubmitSchema } from "@/lib/validation/assessment";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import {
  getCurrentUser,
  hasAssessmentAccess,
} from "@/lib/auth/assessmentAuthorization";
import { answerMatchesGuide } from "@/service/comprehension-test/answerMatching";
import { gradeEssayAnswer } from "@/service/comprehension-test/gradeEssayService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = oralReadingComprehensionSubmitSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: getFirstZodErrorMessage(validationResult.error) },
        { status: 400 },
      );
    }

    const { assessmentId, answers } = validationResult.data;

    const assessmentToken = request.headers.get("x-assessment-token");
    const currentUser = await getCurrentUser();
    if (
      !(await hasAssessmentAccess(
        assessmentId,
        assessmentToken,
        currentUser?.id,
      ))
    ) {
      return NextResponse.json(
        { error: currentUser ? "Forbidden" : "Unauthorized" },
        { status: currentUser ? 403 : 401 },
      );
    }

    // 1. Get assessment + passage + quiz
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        ...(currentUser && !assessmentToken
          ? {
              student: {
                archived: false,
                classRoom: {
                  userId: currentUser.id,
                  archived: false,
                },
              },
            }
          : {}),
      },
      include: {
        passage: {
          include: {
            quiz: {
              include: {
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

    if (!assessment?.passage?.quiz) {
      return NextResponse.json(
        { error: "Assessment, passage, or quiz not found" },
        { status: 404 },
      );
    }

    const quiz = assessment.passage.quiz;
    const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));

    // 2. Grade answers before returning so the UI receives the final score.
    const gradedAnswers: {
      questionId: string;
      questionText: string;
      answer: string;
      isCorrect: boolean;
      tag: Tags;
    }[] = [];

    for (const a of answers) {
      const question = questionMap.get(a.questionId);
      if (!question) continue;

      if (question.type === "MULTIPLE_CHOICE") {
        const isCorrect =
          question.correctAnswer?.trim().toLowerCase() ===
          a.answer.trim().toLowerCase();
        gradedAnswers.push({
          questionId: a.questionId,
          questionText: question.questionText,
          answer: a.answer,
          isCorrect,
          tag: question.tags,
        });
      } else {
        const guideMatch = answerMatchesGuide(question.correctAnswer, a.answer);
        const essayGrade = guideMatch
          ? { isCorrect: true }
          : await gradeEssayAnswer({
              questionText: question.questionText,
              correctAnswer: question.correctAnswer,
              passageContent: assessment.passage.content,
              studentAnswer: a.answer,
              tag: question.tags,
            });

        gradedAnswers.push({
          questionId: a.questionId,
          questionText: question.questionText,
          answer: a.answer,
          isCorrect: essayGrade.isCorrect,
          tag: question.tags,
        });
      }
    }

    // 3. Preliminary score
    const mcCorrect = gradedAnswers.filter((a) => a.isCorrect === true).length;
    const totalItems = quiz.questions.length;
    const prelimPct = totalItems > 0 ? (mcCorrect / totalItems) * 100 : 0;
    const prelimLevel = classifyComprehensionLevel(prelimPct);

    // 4. Save — ComprehensionResult has NO quizId
    //    ComprehensionAnswer uses question (string) + tag, NOT questionId
    const ComprehensionResult = await prisma.comprehensionResult.create({
      data: {
        assessmentId,
        score: mcCorrect,
        totalItems,
        classificationLevel: prelimLevel,
        answers: {
          create: gradedAnswers.map((a) => ({
            question: a.questionText,
            tag: a.tag,
            answer: a.answer,
            isCorrect: a.isCorrect,
          })),
        },
      },
      select: { id: true },
    });

    // 6. Try to compute oral reading level
    let oralReadingResult = null;
    try {
      const response = await createOralReadingService(
        assessmentId,
        prelimLevel,
      );
      if (response.success) {
        oralReadingResult = response;
      }
    } catch {
      console.log("Oral reading level not ready (transcription may be pending)");
    }

    return NextResponse.json({
      success: true,
      assessmentId,
      comprehensionResultId: ComprehensionResult.id,
      score: mcCorrect,
      totalItems,
      level: prelimLevel,
      answers: gradedAnswers.map((a) => ({
        tag: a.tag,
        isCorrect: a.isCorrect,
      })),
      essaysPending: false,
      oralReadingResult: oralReadingResult ?? null,
      transcriptionPending: oralReadingResult === null,
    });
  } catch (error) {
    console.error("Comprehension submit error:", error);
    return NextResponse.json(
      { error: "Failed to process comprehension submission" },
      { status: 500 },
    );
  }
}
