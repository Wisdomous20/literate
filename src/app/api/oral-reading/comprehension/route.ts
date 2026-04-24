import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gradingQueue, oralReadingLevelQueue } from "@/lib/queues";
import type { GradingJobData } from "@/lib/queues";
import classifyComprehensionLevel from "@/service/comprehension-test/classifyComprehensionLevel";
import { createOralReadingService } from "@/service/oral-reading/createOralReadingService";
import { Tags } from "@/generated/prisma/enums";
import { oralReadingComprehensionSubmitSchema } from "@/lib/validation/assessment";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

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

    // 1. Get assessment + passage + quiz
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
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

    // 2. Grade MC immediately, mark essays as pending
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

    // 3. Preliminary score
    const mcCorrect = gradedAnswers.filter((a) => a.isCorrect === true).length;
    const totalItems = quiz.questions.length;
    const prelimPct = totalItems > 0 ? (mcCorrect / totalItems) * 100 : 0;
    const prelimLevel = classifyComprehensionLevel(prelimPct);

    // 4. Save — ComprehensionTest has NO quizId
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

    // 5. Enqueue essay grading if needed
    if (hasEssays) {
      const jobData: GradingJobData = {
        assessmentId,
        comprehensionTestId: comprehensionTest.id,
        answers: answers.filter((a) => {
          const q = questionMap.get(a.questionId);
          return q?.type === "ESSAY";
        }),
      };

      await gradingQueue.add(`grade-${assessmentId}`, jobData, {
        jobId: `grading-${assessmentId}`,
      });
    }

    // 6. Try to compute oral reading level
    let oralReadingResult = null;
    if (!hasEssays) {
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
    } else {
      await oralReadingLevelQueue.add(
        `oral-reading-${assessmentId}`,
        { assessmentId },
        { jobId: `oral-reading-${assessmentId}`, delay: 15000 },
      );
    }

    return NextResponse.json({
      success: true,
      assessmentId,
      comprehensionTestId: comprehensionTest.id,
      score: mcCorrect,
      totalItems,
      level: prelimLevel,
      answers: gradedAnswers.map((a) => ({
        tag: a.tag,
        isCorrect: a.isCorrect,
      })),
      essaysPending: hasEssays,
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
