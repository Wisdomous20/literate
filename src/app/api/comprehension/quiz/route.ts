import { NextRequest, NextResponse } from "next/server";
import { createQuizService } from "@/service/admin/createQuizService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passageId, totalScore, questions } = body;

    if (!passageId || !totalScore || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: passageId, totalScore, questions" },
        { status: 400 }
      );
    }

    // Validate each question
    for (const q of questions) {
      if (!q.questionText || !q.tags || !q.type) {
        return NextResponse.json(
          { error: "Each question requires questionText, tags, and type" },
          { status: 400 }
        );
      }

      if (q.type === "MULTIPLE_CHOICE") {
        if (!Array.isArray(q.options) || q.options.length < 2 || !q.correctAnswer) {
          return NextResponse.json(
            { error: "Multiple choice questions require at least 2 options and a correctAnswer" },
            { status: 400 }
          );
        }
      }
    }

    const result = await createQuizService({
      passageId,
      totalScore,
      totalNumber: questions.length,
      questions,
    });

    if (!result.success) {
      const status = result.code === "VALIDATION_ERROR" ? 400 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result.quiz, { status: 201 });
  } catch (error) {
    console.error("Create quiz error:", error);
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    );
  }
}