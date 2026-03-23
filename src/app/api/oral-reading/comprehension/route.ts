import { NextRequest, NextResponse } from "next/server";
import { submitComprehensionService } from "@/service/comprehension-test/submitComprehensionService";
import { createOralReadingService } from "@/service/oral-reading/createOralReadingService";

export const maxDuration = 60;

interface SubmitAnswer {
  questionId: string;
  answer: string;
}

interface SubmitComprehensionInput {
  assessmentId: string;
  answers: SubmitAnswer[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assessmentId, answers } = body as SubmitComprehensionInput;

    if (!assessmentId || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: assessmentId, answers" },
        { status: 400 },
      );
    }

    const isValidAnswers = answers.every(
      (a) => typeof a.questionId === "string" && typeof a.answer === "string",
    );
    if (!isValidAnswers) {
      return NextResponse.json(
        { error: "Each answer must have questionId and answer fields" },
        { status: 400 },
      );
    }

    // Submit comprehension first so the classification level is saved to the DB
    const result = await submitComprehensionService({ assessmentId, answers });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Try to compute the oral reading level (needs both fluency & comprehension in DB)
    // If fluency is not ready yet (still transcribing), this will fail gracefully
    let oralReadingResult = null;
    try {
      const oralReadingResponse = await createOralReadingService(
        assessmentId,
        result.level,
      );

      if (oralReadingResponse.success) {
        oralReadingResult = oralReadingResponse;
      } else {
        console.log("Oral reading result not created yet:", oralReadingResponse.error);
        console.log("This is expected if transcription is still processing");
      }
    } catch (error) {
      console.log("Could not create oral reading result (transcription may still be processing):", error);
    }

    return NextResponse.json({
      success: true,
      assessmentId,
      comprehensionTestId: result.comprehensionTestId,
      score: result.score,
      totalItems: result.totalItems,
      level: result.level,
      answers: result.answers,
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