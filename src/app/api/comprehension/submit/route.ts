import { NextRequest, NextResponse } from "next/server";
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

    const result = await submitComprehensionService({
      studentId,
      passageId,
      quizId,
      answers,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Comprehension submit error:", error);
    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}