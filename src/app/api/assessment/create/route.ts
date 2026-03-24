import { NextRequest, NextResponse } from "next/server";
import { createAssessmentService } from "@/service/assessment/createAssessmentService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, passageId, type } = body;

    if (!studentId || !passageId || !type) {
      return NextResponse.json(
        { error: "studentId, passageId, and type are required" },
        { status: 400 }
      );
    }

    const result = await createAssessmentService({
      studentId,
      passageId,
      type,
    });

    if (!result.success || !result.assessment) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || "Failed to create assessment" 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        assessment: result.assessment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating assessment:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to create assessment" 
      },
      { status: 500 }
    );
  }
}