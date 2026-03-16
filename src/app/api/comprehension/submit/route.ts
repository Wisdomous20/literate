import { NextRequest, NextResponse } from "next/server";
import { createAssessmentService } from "@/service/assessment/createAssessmentService";
import { submitComprehensionService } from "@/service/comprehension-test/submitComprehensionService";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, passageId, answers } = body;

    if (!studentId || !passageId || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, passageId, answers" },
        { status: 400 }
      );
    }

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