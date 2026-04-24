import { NextRequest, NextResponse } from "next/server";
import { createAssessmentService } from "@/service/assessment/createAssessmentService";
import { createAssessmentSchema } from "@/lib/validation/assessment";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = createAssessmentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: getFirstZodErrorMessage(validationResult.error) },
        { status: 400 }
      );
    }
    const { studentId, passageId, type } = validationResult.data;

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
