import { NextRequest, NextResponse } from "next/server";
import { submitComprehensionService } from "@/service/comprehension-test/submitComprehensionService";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assessmentId, answers } = body;

    if (!assessmentId || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: assessmentId, answers" },
        { status: 400 }
      );
    }

    const result = await submitComprehensionService({
      assessmentId,
      answers,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      assessmentId,
      comprehensionTestId: result.comprehensionTestId,
      score: result.score,
      totalItems: result.totalItems,
      level: result.level,
    });
  } catch (error) {
    console.error("Comprehension submit error:", error);
    return NextResponse.json(
      { error: "Failed to process comprehension submission" },
      { status: 500 }
    );
  }
}