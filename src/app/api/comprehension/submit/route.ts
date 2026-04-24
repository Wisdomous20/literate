import { NextRequest, NextResponse } from "next/server";
import { createAssessmentService } from "@/service/assessment/createAssessmentService";
import { prisma } from "@/lib/prisma";
import { gradingQueue } from "@/lib/queues";
import type { GradingJobData } from "@/lib/queues";
import classifyComprehensionLevel from "@/service/comprehension-test/classifyComprehensionLevel";
import { Tags } from "@/generated/prisma/enums";
import { comprehensionSubmitSchema } from "@/lib/validation/assessment";
import { getFirstZodErrorMessage } from "@/lib/validation/common";



export const maxDuration = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = comprehensionSubmitSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: getFirstZodErrorMessage(validationResult.error) },
        { status: 400 },
      );
    }

    const { studentId, passageId, answers } = validationResult.data;

    // 1. Create assessment
    const assessmentResult = await createAssessmentService({
      studentId,
      passageId,
      type: "COMPREHENSION",
    });

    if (!assessmentResult.success || !assessmentResult.assessment) {
      return NextResponse.json(
        { error: assessmentResult.error || "Failed to create assessment" },
        { status: 400 },
      );
    }

    const assessmentId = assessmentResult.assessment.id;

    // 2. Get quiz + questions
    const passage = await prisma.passage.findUnique({
      where: { id: passageId },
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
    });

    if (!passage?.quiz) {
      return NextResponse.json(
        { error: "No quiz found for this passage" },
        { status: 400 },
      );
    }

    const quiz = passage.quiz;
    const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));

    // 3. Grade MC immediately, mark essays as pending
    let hasEssays = false;
    const gradedAnswers: {
      questionId: string;
      questionText: string;
      answer: string;
      isCorrect: boolean | null;
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
        gradedAnswers.push({
          questionId: a.questionId,
          questionText: question.questionText,
          answer: a.answer,
          isCorrect: null,
          tag: question.tags,
        });
        hasEssays = true;
      }
    }

    // 4. Preliminary score (MC only)
    const mcCorrect = gradedAnswers.filter((a) => a.isCorrect === true).length;
    const totalItems = quiz.questions.length;
    const prelimPct = totalItems > 0 ? (mcCorrect / totalItems) * 100 : 0;
    const prelimLevel = classifyComprehensionLevel(prelimPct);

    // 5. Save — ComprehensionTest has NO quizId
    //    ComprehensionAnswer uses question (string) + tag, NOT questionId
    const comprehensionTest = await prisma.comprehensionTest.create({
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

    // 6. Enqueue essay grading if needed
    if (hasEssays) {
      const jobData: GradingJobData = {
        assessmentId,
        comprehensionTestId: comprehensionTest.id,
        answers: answers.filter((a: { questionId: string }) => {
          const q = questionMap.get(a.questionId);
          return q?.type === "ESSAY";
        }),
      };

      await gradingQueue.add(`grade-${assessmentId}`, jobData, {
        jobId: `grading-${assessmentId}`,
      });
    }

    return NextResponse.json({
      success: true,
      assessmentId,
      comprehensionTestId: comprehensionTest.id,
      score: mcCorrect,
      totalItems,
      percentage: Math.round(prelimPct),
      level: prelimLevel,
      essaysPending: hasEssays,
      answers: gradedAnswers.map((a) => ({
        tag: a.tag,
        isCorrect: a.isCorrect,
      })),
    });
  } catch (error) {
    console.error("Comprehension submit error:", error);
    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 },
    );
  }
}
