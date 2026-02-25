import { NextRequest, NextResponse } from "next/server";
import { createAssessmentService } from "@/service/assessment/createAssessmentService";
import { submitComprehensionService } from "@/service/comprehension-test/submitComprehensionService";

export const maxDuration = 60; // allow time for OpenAI essay grading

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, passageId, quizId, answers } = body;

    if (!studentId || !passageId || !quizId || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, passageId, quizId, answers" },
        { status: 400 }
      );
    }

    // 1. Create assessment FIRST
    const assessmentResult = await createAssessmentService({
      studentId,
      passageId,
      type: "COMPREHENSION",
    });

    if (!assessmentResult.success || !assessmentResult.assessment) {
      return NextResponse.json(
        { error: assessmentResult.error || "Failed to create assessment" },
        { status: 400 }
      );
    }

    // 2. Then create comprehension test with assessmentId
    const result = await submitComprehensionService({
      assessmentId: assessmentResult.assessment.id,
      answers,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      ...result,
      assessmentId: assessmentResult.assessment.id,
    });
  } catch (error) {
    console.error("Comprehension submit error:", error);
    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}