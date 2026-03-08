import { NextRequest, NextResponse } from "next/server";
import { submitComprehensionService } from "@/service/comprehension-test/submitComprehensionService";
import { createOralReadingService } from "@/service/oral-reading/createOralReadingService";

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

    // Submit comprehension first so the classification level is saved to the DB
    const result = await submitComprehensionService({ assessmentId, answers });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Now compute the oral reading level (needs both fluency & comprehension in DB)
    const oralReadingResult = await createOralReadingService(assessmentId);

    if (!oralReadingResult.success) {
      return NextResponse.json({ error: oralReadingResult.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      assessmentId,
      comprehensionTestId: result.comprehensionTestId,
      score: result.score,
      totalItems: result.totalItems,
      level: result.level,
      oralReadingResult: oralReadingResult ?? null,
    });
  } catch (error) {
    console.error("Comprehension submit & oralReading submit error:", error);
    return NextResponse.json(
      { error: "Failed to process comprehension submission" },
      { status: 500 }
    );
  }
}